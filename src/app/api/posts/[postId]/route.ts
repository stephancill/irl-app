import { withAuth } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export const GET = withAuth<{ params: Promise<{ postId: string }> }>(
  async (req, user, context) => {
    const { postId } = await context.params;

    if (!postId) {
      return Response.json({ error: "Missing postId" }, { status: 400 });
    }

    const post = await db
      .selectFrom("posts")
      .selectAll()
      .where("id", "=", postId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const isReady = post.frontImageUrl && post.backImageUrl;

    return Response.json({ post, isReady });
  }
);

export const DELETE = withAuth<{ params: Promise<{ postId: string }> }>(
  async (req, user, context) => {
    const { postId } = await context.params;

    if (!postId) {
      return Response.json({ error: "Missing postId" }, { status: 400 });
    }

    await db
      .deleteFrom("posts")
      .where("id", "=", postId)
      .where("userId", "=", user.id)
      .execute();

    return Response.json({ success: true });
  }
);
