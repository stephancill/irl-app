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
  ]);
