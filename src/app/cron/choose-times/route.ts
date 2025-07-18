import { NextRequest } from "next/server";
import { queueTimezoneJobs } from "@/tasks/queue-timezone";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  await queueTimezoneJobs();

  return new Response(null, { status: 200 });
}
