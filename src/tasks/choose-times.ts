/**
 * This task is responsible for choosing the times that alerts should be sent for each timezone
 *
 * It will be run every day at 11:59pm UTC
 */

import { ANCHOR_TIMEZONES } from "../lib/constants";
import { alertsTimezonesQueue } from "../lib/queue";
import { getBoundedRandomTime } from "../lib/utils";
import { TimezoneJobData } from "../types/jobs";

async function main() {
  const timezoneJobsData = ANCHOR_TIMEZONES.map((tz) => {
    const date = getBoundedRandomTime(tz);
    return {
      timezone: tz,
      date: date.toISOString(),
    } as TimezoneJobData;
  });

  await alertsTimezonesQueue.addBulk(
    timezoneJobsData.map((data) => {
      const date = new Date(data.date);

      return {
        name: data.timezone,
        data: data,
        opts: {
          delay: date.getTime() - Date.now(),
        },
      };
    })
  );
}

main();
