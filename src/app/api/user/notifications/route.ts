import { withAuth } from "@/lib/auth";
import { setUserNotificationDetails } from "@/lib/notifications";
import { db } from "../../../../lib/db";

export const PATCH = withAuth(async (req, user) => {
  const { token, url, postNotificationsEnabled } = await req.json();

  if (token && url) {
    await setUserNotificationDetails(user.fid, {
      token,
      url,
    });
  }

  if (postNotificationsEnabled !== undefined) {
    await db
      .updateTable("users")
      .set({
        newPostNotifications: postNotificationsEnabled,
      })
      .where("id", "=", user.id)
      .execute();
  }

  return Response.json({ success: true });
});
