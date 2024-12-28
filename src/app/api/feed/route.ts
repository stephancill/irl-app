import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "kysely";

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 5;

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
    .where("posts.deletedAt", "is", null)
    .where("posts.frontImageUrl", "is not", null)
    .where("posts.backImageUrl", "is not", null)
    .orderBy("posts.createdAt", "desc")
    .limit(limit + 1);

  if (cursor) {
    query = query.where("posts.createdAt", "<", new Date(cursor));
  }

  let posts = await query.execute();

  // Replace image urls with placeholder if user hasn't posted today
  const latestAlert = await db
    .selectFrom("postAlerts")
    .select(["id", "timeUtc", "timezone"])
    .where("timezone", "=", user.timezone)
    .orderBy("timeUtc", "desc")
    .$call((qb) => qb.limit(1))
    .executeTakeFirst();

  if (!latestAlert) {
    throw new Error("User has no latest alert");
  }

  const userPostsToday = await db
    .selectFrom("posts")
    .selectAll()
    .where("userId", "=", user.id)
    .where("postAlertId", "=", latestAlert.id)
    .where("deletedAt", "is", null)
    .execute();

  const canViewPosts = userPostsToday.length > 0;

  if (!canViewPosts) {
    posts = posts.map((post) => ({
      ...post,
      frontImageUrl: null,
      backImageUrl: null,
    }));
  }

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
