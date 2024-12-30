import { ANCHOR_TIMEZONES } from "./constants";
import { db } from "./db";

export const latestPostAlert = db
  .selectFrom("postAlerts")
  .select(["id", "timeUtc", "timezone"])
  .orderBy("timeUtc", "desc")
  .limit(ANCHOR_TIMEZONES.length * 2);
