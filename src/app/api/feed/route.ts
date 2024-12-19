import { withAuth } from "../../../lib/auth";
import { db } from "../../../lib/db";

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  // TODO: Only show posts from users that the user follows
  let query = db
    .selectFrom("posts")
    .innerJoin("users", "users.id", "posts.userId")
    .select([
      "posts.id",
      "posts.imageUrl",
      "posts.createdAt",
      "users.id as userId",
      "users.fid",
      "users.timezone",
    ])
    .where("posts.createdAt", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000))
    .orderBy("posts.createdAt", "desc")
    .limit(limit + 1);

  if (cursor) {
    query = query.where("createdAt", "<", new Date(cursor));
  }

  const posts = await query.execute();

  // Check if there are more posts
  const hasMore = posts.length > limit;
  const nextPosts = hasMore ? posts.slice(0, -1) : posts;

  return Response.json({
    posts: nextPosts,
    nextCursor: hasMore
      ? posts[posts.length - 2].createdAt.toISOString()
      : null,
  });
});
