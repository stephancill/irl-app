import { withAuth } from "@/lib/auth";
import { ANCHOR_TIMEZONES_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (req, luciaUser) => {
  const { timezone } = await req.json();

  if (!timezone) {
    return Response.json({ error: "Timezone is required" }, { status: 400 });
  }

  if (!Object.keys(ANCHOR_TIMEZONES_LABELS).includes(timezone)) {
    return Response.json({ error: "Invalid timezone" }, { status: 400 });
  }

  await db
    .updateTable("users")
    .set({ timezone })
    .where("id", "=", luciaUser.id)
    .execute();

  return Response.json({ success: true });
});
