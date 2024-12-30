import { db } from "@/lib/db";
import { alertsBulkQueue } from "@/lib/queue";
import { redisQueue } from "@/lib/redis";
import { AlertsBulkJobData, TimezoneJobData } from "@/types/jobs";
import { Worker } from "bullmq";
import { ALERTS_TIMEZONES_QUEUE_NAME } from "../lib/constants";

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

    // Group users by notification url
    const usersByUrl = users.reduce((acc, user) => {
      const notificationUrl = user.notificationUrl!;
      if (!acc[notificationUrl]) {
        acc[notificationUrl] = [];
      }
      acc[notificationUrl].push(user);
      return acc;
    }, {} as Record<string, typeof users>);

    // Then chunk each webhook group into groups of 100
    const allChunks: Array<{
      notificationUrl: string;
      users: typeof users;
      chunkId: number;
    }> = [];
    Object.entries(usersByUrl).forEach(([notificationUrl, webhookUsers]) => {
      let chunkId = 0;

      for (let i = 0; i < webhookUsers.length; i += 100) {
        allChunks.push({
          notificationUrl,
          users: webhookUsers.slice(i, i + 100),
          chunkId: chunkId++,
        });
      }
    });

    const jobs = await alertsBulkQueue.addBulk(
      allChunks.map((chunk) => ({
        name: `${postAlert.id}-${chunk.notificationUrl}-${chunk.chunkId}`,
        data: {
          notifications: chunk.users.map((user) => ({
            fid: user.fid,
            token: user.notificationToken!,
          })),
          url: chunk.notificationUrl,
          alertId: postAlert.id,
          chunkId: chunk.chunkId,
        } satisfies AlertsBulkJobData,
      }))
    );

    return jobs.length;
  },
  {
    connection: redisQueue,
  }
);
