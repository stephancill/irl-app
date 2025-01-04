import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "@/lib/db";
import { redisQueue } from "@/lib/redis";
import { TimezoneJobData } from "@/types/jobs";
import { Worker } from "bullmq";
import { ALERTS_TIMEZONES_QUEUE_NAME } from "../lib/constants";
import { notifyUsers } from "../lib/notifications";

export const timezonesWorker = new Worker<TimezoneJobData>(
  ALERTS_TIMEZONES_QUEUE_NAME,
  async (job) => {
    const { timezone: anchorTz, date } = job.data;

    const time = new Date(date);

    // Create new target date in db if it doesn't exist
    const postAlert = await db
      .insertInto("postAlerts")
      .values({
        timeUtc: time,
        timezone: anchorTz,
      })
      .onConflict((oc) =>
        oc.constraint("unique_timezone_time_utc").doUpdateSet({
          timeUtc: time,
          timezone: anchorTz,
        })
      )
      .returningAll()
      .executeTakeFirst();

    if (!postAlert) {
      throw new Error("Failed to create post alert");
    }

    // Find users to send alerts for this time
    const users = await db
      .selectFrom("users")
      .selectAll()
      .where("timezone", "=", anchorTz)
      .where("notificationToken", "is not", null)
      .where("notificationUrl", "is not", null)
      .execute();

    const jobs = await notifyUsers({
      users: users.map((user) => ({
        token: user.notificationToken!,
        url: user.notificationUrl!,
        fid: user.fid,
      })),
      title: "it's time for your irl!",
      body: "post within 5 minutes to be on time",
      targetUrl: process.env.APP_URL,
    });

    return jobs.length;
  },
  {
    connection: redisQueue,
  }
);
