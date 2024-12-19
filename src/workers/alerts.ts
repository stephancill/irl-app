import { Worker } from "bullmq";
import { ALERTS_BULK_QUEUE_NAME } from "../lib/constants";
import { redis } from "../lib/redis";
import { sendNotifications } from "../lib/warpcast";
import { AlertsBulkJobData } from "../types/jobs";

export const alertsBulkWorker = new Worker<AlertsBulkJobData>(
  ALERTS_BULK_QUEUE_NAME,
  async (job) => {
    const { notifications, alertId, chunkId } = job.data;

    const warpcastTokens = notifications.map(
      ({ warpcastToken }) => warpcastToken
    );

    await sendNotifications({
      data: {
        tokens: warpcastTokens,
        title: "It's time to post your daily snap!",
        body: "Post your snap within 5 minutes to be on time",
        targetUrl: process.env.APP_URL,
        notificationId: `dailysnap-${alertId}-${chunkId}`,
      },
    });
  },
  { connection: redis }
);
