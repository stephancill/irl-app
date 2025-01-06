import { Worker } from "bullmq";
import { NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME } from "../lib/constants";
import { db } from "../lib/db";
import { getUserDatasCached } from "../lib/farcaster";
import { sendFrameNotification } from "../lib/notifications";
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
        .select(["users.fid as authorFid", "commenter.fid as commenterFid"])
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

      const [commenter] = await getUserDatasCached([comment.commenterFid]);

      // Notify the author of the new comment
      const result = await sendFrameNotification({
        title: "new comment",
        body: `@${commenter.username} commented on your post`,
        fid: comment.authorFid,
        targetUrl: `${process.env.APP_URL}/posts/${postId}`,
      });

      return result;
    },
    {
      connection: redisQueue,
    }
  );
