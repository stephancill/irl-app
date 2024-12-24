import { Worker } from "bullmq";
import { ALERTS_BULK_QUEUE_NAME } from "../lib/constants";
import { redis } from "../lib/redis";
import { AlertsBulkJobData } from "../types/jobs";
import { sendFrameNotifications } from "../lib/notifications";

export const alertsBulkWorker = new Worker<AlertsBulkJobData>(
  ALERTS_BULK_QUEUE_NAME,
  async (job) => {
    const { notifications, url, alertId, chunkId } = job.data;

    const tokens = notifications.map(({ token }) => token);

    await sendFrameNotifications({
      tokens,
      title: "It's time to post your daily snap!",
      body: "Post your snap within 5 minutes to be on time",
      url,
      targetUrl: process.env.APP_URL,
      notificationId: `dailysnap-${alertId}-${chunkId}`,
    });
  },
  { connection: redis }
);
