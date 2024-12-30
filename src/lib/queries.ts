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
