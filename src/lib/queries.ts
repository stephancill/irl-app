import { sql } from "kysely";
import { db } from "./db";

export const latestPostAlert = db
  .selectFrom("postAlerts")
  .select([
    "timezone",
    db.fn.max("timeUtc").as("timeUtc"),
    db.fn.max<number>("id").as("id"),
  ])
  .groupBy("timezone")
  .orderBy("timeUtc", "desc");

export const postsForRendering = db
  .selectFrom("posts")
  .innerJoin("users", "users.id", "posts.userId")
  .innerJoin("postAlerts", "postAlerts.id", "posts.postAlertId")
  .leftJoin("comments", "comments.postId", "posts.id")
  .leftJoin("users as comment_users", "comment_users.id", "comments.userId")
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
    sql<number>`(
      WITH daily_posts AS (
        SELECT 
          DATE_TRUNC('day', created_at) AS post_date
        FROM posts
        WHERE 
          user_id = users.id
          AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('day', created_at)
      ),
      gaps AS (
        SELECT 
          post_date,
          post_date - (LAG(post_date, 1) OVER (ORDER BY post_date)) AS gap
        FROM daily_posts
      ),
      streaks AS (
        SELECT 
          post_date,
          SUM(CASE WHEN gap != INTERVAL '1 day' THEN 1 ELSE 0 END) OVER (ORDER BY post_date) AS streak_group
        FROM gaps
      )
      SELECT 
        COUNT(*)
      FROM streaks
      WHERE 
        streak_group = (SELECT streak_group FROM streaks WHERE post_date = (SELECT MAX(post_date) FROM streaks))
    )`.as("userStreak"),
    sql<any[]>`
      COALESCE(
        NULLIF(
          JSON_AGG(
            CASE WHEN comments.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', comments.id,
                'content', comments.content,
                'createdAt', comments.created_at,
                'userId', comments.user_id,
                'userFid', comment_users.fid
              )
            END
          ) FILTER (WHERE comments.deleted_at IS NULL)::text,
          '[null]'
        )::json,
        '[]'::json
      )
    `.as("comments"),
  ])
  .groupBy(["posts.id", "users.id", "postAlerts.id"]);
