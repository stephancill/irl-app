import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMutuals, getUserDatasCached } from "@/lib/farcaster";
import { getMutualsKey } from "@/lib/keys";
import { processPostsVisibility } from "@/lib/posts";
import { postsForRendering } from "@/lib/queries";
import { withCache } from "@/lib/redis";

export const GET = withAuth<{ params: Promise<{ postId: string }> }>(
  async (req, user, context) => {
    const { postId } = await context.params;

    if (!postId) {
      return Response.json({ error: "Missing postId" }, { status: 400 });
    }

    const post = await postsForRendering
      .where("posts.id", "=", postId)
      .executeTakeFirst();

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      const mutuals = await withCache(getMutualsKey(user.fid), () =>
        getMutuals(user.fid)
      );

      const isMutual = mutuals.some((m) => m.fid === post.fid);
      if (!isMutual) {
        return Response.json(
          {
            error:
              "You can only view posts from users you follow and who follow you back.",
          },
          { status: 403 }
        );
      }
    }

    const [postProcessed] = await processPostsVisibility([post], user);

    const userDatas = await getUserDatasCached([postProcessed.fid]);

    const isReady = post.frontImageUrl && post.backImageUrl;
    return Response.json({ post: postProcessed, isReady, user: userDatas[0] });
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
