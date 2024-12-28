import { sql } from "kysely";
import { withAuth } from "../../../lib/auth";
import { db } from "../../../lib/db";

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 2;

  // TODO: Only show posts from users that the user follows
  let query = db
    .selectFrom("posts")
    .innerJoin("users", "users.id", "posts.userId")
    .innerJoin("postAlerts", "postAlerts.id", "posts.postAlertId")
    .select([
      "posts.id",
      "posts.frontImageUrl",
      "posts.backImageUrl",
      "posts.primaryImage",
      "posts.createdAt",
      "posts.postAlertId",
      "users.id as userId",
      "users.fid",
      "users.timezone",
      "postAlerts.id as postAlertId",
      "postAlerts.timeUtc as postAlertTimeUtc",
      sql<Date>`posts.created_at < post_alerts.time_utc + INTERVAL '5 MINUTES'`.as(
        "postOnTime"
      ),
    ])
    .where("posts.createdAt", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000))
    .orderBy("posts.createdAt", "desc")
    .limit(limit + 1);

  if (cursor) {
    query = query.where("posts.createdAt", "<", new Date(cursor));
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
