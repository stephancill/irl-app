import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postsAllowanceDetails } from "@/lib/posts";
import { latestPostAlert } from "@/lib/queries";
import { User } from "@/types/user";
import { sql } from "kysely";

export const GET = withAuth(async (req, luciaUser) => {
  // Check if the fid is already registered
  const dbUser = await db
    .selectFrom("users")
    .leftJoin(latestPostAlert.as("latestAlert"), (join) =>
      join.onRef("latestAlert.timezone", "=", "users.timezone")
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
      "users.newPostNotifications",
    ])
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
    fid: dbUser.fid,
    id: dbUser.id,
    timezone: dbUser.timezone,
    latestAlertId: dbUser.latestAlertId,
    latestAlertTime: dbUser.latestAlertTime,
    latestAlertExpiry: dbUser.latestAlertExpiry,
    postsRemaining: allowanceDetails.postsRemaining,
    postsToday: allowanceDetails.postsToday,
    notificationsEnabled: dbUser.notificationUrl !== null,
    postNotificationsEnabled: dbUser.newPostNotifications,
  };

  return Response.json(user);
});
