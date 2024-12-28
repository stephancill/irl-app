import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // Delete posts older than 2 minutes that have no front or back image
  await db
    .deleteFrom("posts")
    .where("createdAt", "<", new Date(Date.now() - 2 * 60 * 1000))
    .where((eb) =>
      eb.or([eb("frontImageUrl", "is", null), eb("backImageUrl", "is", null)])
    )
    .execute();

  return new Response(null, { status: 200 });
}
