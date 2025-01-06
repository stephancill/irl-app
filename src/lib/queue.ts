import { Queue } from "bullmq";
import {
  ALERTS_BULK_QUEUE_NAME,
  ALERTS_QUEUE_NAME,
  ALERTS_TIMEZONES_QUEUE_NAME,
  NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME,
  NEW_POST_NOTIFICATIONS_QUEUE_NAME,
} from "./constants";
import { redisQueue } from "./redis";
import {
  NewCommentNotificationsJobData,
  NewPostNotificationsJobData,
} from "../types/jobs";

export const alertsBulkQueue = new Queue(ALERTS_BULK_QUEUE_NAME, {
  connection: redisQueue,
});

export const alertsQueue = new Queue(ALERTS_QUEUE_NAME, {
  connection: redisQueue,
});

export const alertsTimezonesQueue = new Queue(ALERTS_TIMEZONES_QUEUE_NAME, {
  connection: redisQueue,
});

export const newPostNotificationsQueue = new Queue<NewPostNotificationsJobData>(
  NEW_POST_NOTIFICATIONS_QUEUE_NAME,
  {
    connection: redisQueue,
  }
);

export const newCommentNotificationsQueue =
  new Queue<NewCommentNotificationsJobData>(
    NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME,
    {
      connection: redisQueue,
    }
  );
