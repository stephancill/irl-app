import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postsAllowanceDetails } from "@/lib/posts";
import { User } from "@/types/user";
import { sql } from "kysely";
import { ANCHOR_TIMEZONES } from "../../../lib/constants";

const selectUserWithAlert = db
  .selectFrom("users")
  .leftJoin(
    db
      .selectFrom("postAlerts")
      .select(["id", "timeUtc", "timezone"])
      .orderBy("timeUtc", "desc")
      .$call((qb) => qb.limit(ANCHOR_TIMEZONES.length * 2))
      .as("latestAlert"),
    (join) => join.onRef("latestAlert.timezone", "=", "users.timezone")
  )
  .select([
    "users.id",
    "users.fid",
    "users.timezone",
    "users.notificationUrl",
    "users.notificationToken",
    "users.createdAt",
    "users.updatedAt",
    "latestAlert.timeUtc as latestAlertTime",
    sql<Date>`latest_alert.time_utc + INTERVAL '5 MINUTES'`.as(
      "latestAlertExpiry"
    ),
    "latestAlert.id as latestAlertId",
  ]);

export const GET = withAuth(async (req, luciaUser) => {
  // Check if the fid is already registered
  const dbUser = await selectUserWithAlert
    .where("users.id", "=", luciaUser.id)
    .executeTakeFirst();

  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 400 });
  }

  const allowanceDetails = await postsAllowanceDetails(
    dbUser!.id,
    dbUser!.latestAlertId,
    dbUser!.latestAlertExpiry
  );

  const user: User = {
    ...dbUser,
    ...allowanceDetails,
  };

  return Response.json(user);
});
