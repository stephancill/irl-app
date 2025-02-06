import { Job, Worker } from "bullmq";
import { NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME } from "../lib/constants";
import { db } from "../lib/db";
import { getFidsByUsernamesCached, getUserDatasCached } from "../lib/farcaster";
import { notifyUsers, sendFrameNotification } from "../lib/notifications";
import { redisQueue } from "../lib/redis";
import { NewCommentNotificationsJobData } from "../types/jobs";

export const newCommentNotificationsWorker =
  new Worker<NewCommentNotificationsJobData>(
    NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME,
    async (job) => {
      const { postId, commentId } = job.data;

      const comment = await db
        .selectFrom("comments")
        .leftJoin("posts", "comments.postId", "posts.id")
        .leftJoin("users", "posts.userId", "users.id")
        .leftJoin("users as commenter", "comments.userId", "commenter.id")
        .where("comments.id", "=", commentId)
        .select([
          "users.fid as authorFid",
          "commenter.fid as commenterFid",
          "comments.content",
        ])
        .executeTakeFirst();

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (!comment.commenterFid) {
        throw new Error("Commenter not found");
      }

      if (!comment.authorFid) {
        throw new Error("Author not found");
      }

      // Find mentioned usernames in comment
      const mentionedUsernames = comment.content.match(/@(\w+)/g);
      let mentionedFids: number[] = [];

      if (mentionedUsernames) {
        mentionedFids = (
          await getFidsByUsernamesCached(
            mentionedUsernames.map((username) => username.slice(1))
          )
        ).filter((fid) => fid !== comment.authorFid);
      }

      const [commenter] = await getUserDatasCached([comment.commenterFid]);

      let postAuthorNotificationResult: string | null = null;

      if (comment.authorFid !== comment.commenterFid) {
        // Notify the author of the new comment
        const result = await sendFrameNotification({
          title: "new comment",
          body: `@${commenter.username} commented on your post`,
          fid: comment.authorFid,
          targetUrl: `${process.env.APP_URL}/posts/${postId}`,
        });

        postAuthorNotificationResult = result.state;
      }

      let mentionJobs: Job[] = [];

      if (mentionedFids.length > 0) {
        const notificationDetails = await db
          .selectFrom("users")
          .select(["fid", "notificationUrl", "notificationToken"])
          .where("fid", "in", mentionedFids)
          .where("notificationUrl", "is not", null)
          .where("notificationToken", "is not", null)
          .execute();

        if (notificationDetails.length > 0) {
          mentionJobs = await notifyUsers({
            users: notificationDetails.map((user) => ({
              fid: user.fid,
              token: user.notificationToken!,
              url: user.notificationUrl!,
            })),
            title: "new mention",
            body: `@${commenter.username} mentioned you in a comment`,
            targetUrl: `${process.env.APP_URL}/posts/${postId}`,
          });
        }
      }

      return {
        postAuthorNotificationResult,
        mentionNotificationCount: mentionJobs.length,
      };
    },
    {
      connection: redisQueue,
    }
  );
