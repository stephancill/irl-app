/**
 * This task is responsible for choosing the times that alerts should be sent for each timezone
 *
 * It will be run every day at 11:59pm UTC
 */

import { ANCHOR_TIMEZONES } from "../lib/constants";
import { alertsTimezonesQueue } from "../lib/queue";
import { getBoundedRandomTime } from "../lib/utils";
import { TimezoneJobData } from "../types/jobs";

function getJobId(timezone: string, date: Date) {
  const dateString = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${timezone}-${dateString}`;
}

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

      const localNow = new Date();

      return {
        name: data.timezone,
        data: data,
        opts: {
          delay: date.getTime() - Date.now(),
          jobId: getJobId(data.timezone, localNow),
        },
      };
    })
  );
}

main().then(() => {
  console.log("Done");
  process.exit(0);
});
