import { Worker } from "bullmq";
import { NEW_POST_NOTIFICATIONS_QUEUE_NAME } from "../lib/constants";
import { NewPostNotificationsJobData } from "../types/jobs";
import { db } from "../lib/db";
import { redisQueue, withCache } from "../lib/redis";
import { getMutualsKey } from "../lib/keys";
import { getMutuals, getUserDatasCached } from "../lib/farcaster";
import { notifyUsers } from "../lib/notifications";

export const newPostNotificationsWorker =
  new Worker<NewPostNotificationsJobData>(
    NEW_POST_NOTIFICATIONS_QUEUE_NAME,
    async (job) => {
      const { postId } = job.data;

      const user = await db
        .selectFrom("posts")
        .innerJoin("users", "posts.userId", "users.id")
        .where("posts.id", "=", postId)
        .select(["users.fid as fid"])
        .executeTakeFirst();

      if (!user) {
        throw new Error("User not found");
      }

      const [userData] = await getUserDatasCached([user.fid]);

      const mutuals = await withCache(getMutualsKey(user.fid), () =>
        getMutuals(user.fid)
      );
      const mutualsFidsSet = new Set(mutuals.map((m) => m.fid));

      // Filter out mutuals that are not in db
      // TODO: When users >> we need to find a better way to do this
      const allNotificationUsers = await db
        .selectFrom("users")
        .select(["fid", "notificationToken", "notificationUrl"])
        .where("newPostNotifications", "=", true)
        .where("notificationToken", "is not", null)
        .execute();

      const notificationUsers = allNotificationUsers.filter((u) =>
        mutualsFidsSet.has(u.fid)
      );

      if (notificationUsers.length === 0) {
        return 0;
      }

      const jobs = await notifyUsers({
        users: notificationUsers.map((user) => ({
          token: user.notificationToken!,
          url: user.notificationUrl!,
          fid: user.fid,
        })),
        title: "new post",
        body: `@${userData.username} just posted`,
        targetUrl: process.env.APP_URL,
      });

      return jobs.length;
    },
    {
      connection: redisQueue,
    }
  );
