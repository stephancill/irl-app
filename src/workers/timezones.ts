import { Worker } from "bullmq";
import { ALERTS_TIMEZONES_QUEUE_NAME } from "../lib/constants";
import { db } from "../lib/db";
import { alertsBulkQueue } from "../lib/queue";
import { redis } from "../lib/redis";
import { TimezoneJobData, AlertsBulkJobData } from "../types/jobs";

export const timezonesWorker = new Worker<TimezoneJobData>(
  ALERTS_TIMEZONES_QUEUE_NAME,
  async (job) => {
    const { timezone: anchorTz, date } = job.data;

    const time = new Date(date);

    // Create new target date in db
    const postAlert = await db
      .insertInto("postAlerts")
      .values({
        timeUtc: time,
        timezone: anchorTz,
      })
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
      .where("warpcastToken", "is not", null)
      .execute();

    // Group into chunks of 100
    const userChunks: (typeof users)[] = [];
    for (let i = 0; i < users.length; i += 100) {
      userChunks.push(users.slice(i, i + 100));
    }

    const jobs = await alertsBulkQueue.addBulk(
      userChunks.map((chunk, index) => ({
        name: `${postAlert.id}-${index}`,
        data: {
          notifications: chunk.map((user) => ({
            fid: user.fid,
            warpcastToken: user.warpcastToken,
          })),
          alertId: postAlert.id,
          chunkId: index,
        } as AlertsBulkJobData,
      }))
    );

    return jobs.length;
  },
  {
    connection: redis,
  }
);
