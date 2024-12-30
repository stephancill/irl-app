import { Queue } from "bullmq";
import {
  ALERTS_BULK_QUEUE_NAME,
  ALERTS_QUEUE_NAME,
  ALERTS_TIMEZONES_QUEUE_NAME,
} from "./constants";
import { redisQueue } from "./redis";

export const alertsBulkQueue = new Queue(ALERTS_BULK_QUEUE_NAME, {
  connection: redisQueue,
});

export const alertsQueue = new Queue(ALERTS_QUEUE_NAME, {
  connection: redisQueue,
});

export const alertsTimezonesQueue = new Queue(ALERTS_TIMEZONES_QUEUE_NAME, {
  connection: redisQueue,
});
