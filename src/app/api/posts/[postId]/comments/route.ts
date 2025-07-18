import { withAuth } from "@/lib/auth";
import { NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { getMutualsCached } from "@/lib/farcaster";
import { newCommentNotificationsQueue } from "@/lib/queue";

export const POST = withAuth<{ params: Promise<{ postId: string }> }>(
  async (req, user, context) => {
    const { postId } = await context.params;
    const { comment } = await req.json();

    // Verify that user is a mutual
    const post = await db
      .selectFrom("posts")
      .innerJoin("users", "users.id", "posts.userId")
      .where("posts.id", "=", postId)
      .select(["users.fid as fid", "users.id as userId"])
      .executeTakeFirst();

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const mutuals = await getMutualsCached(user.fid);
    const isMutual =
      user.fid === post.fid || mutuals.some((m) => m.fid === post.fid);

    if (!isMutual) {
      return Response.json(
        {
          error:
            "You can only comment on posts from users you follow and who follow you back.",
        },
        { status: 403 }
      );
    }

    const commentId = await db
      .insertInto("comments")
      .values({
        postId,
        userId: user.id,
        content: comment,
      })
      .returning("id")
      .executeTakeFirst();

    if (!commentId) {
      return Response.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Process comment notifications
    await newCommentNotificationsQueue.add(
      NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME,
      {
        postId,
        commentId: commentId.id,
      }
    );

    return Response.json({ commentId });
  }
);
