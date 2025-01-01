/**
 * This task is responsible for choosing the times that alerts should be sent for each timezone
 *
 * It will be run every day at 11:59pm UTC
 */

import { ANCHOR_TIMEZONES } from "../lib/constants";
import { alertsTimezonesQueue } from "../lib/queue";
import { getBoundedRandomTime } from "../lib/utils";
import { TimezoneJobData } from "../types/jobs";

/**
 * Creates a job id for the timezone job to prevent multiple jobs from running on the same day
 * @param timezone - The timezone to generate a job id for
 * @param date - The date to generate a job id for
 * @returns The job id
 */
function getJobId(timezone: string, date: Date) {
  const dateString = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const id = `${timezone}-${dateString}`;

  return id;
}

/**
 * @param definedTimes - A map of timezone to date. If provided, the dates will be used instead of random dates.
 */
export async function queueTimezoneJobs(definedTimes?: Record<string, Date>) {
  const timezoneJobsData = definedTimes
    ? (Object.entries(definedTimes).map(([tz, date]) => ({
        timezone: tz,
        date: date.toISOString(),
        localTime: date.toISOString(),
      })) satisfies TimezoneJobData[])
    : (ANCHOR_TIMEZONES.map((tz) => {
        const { targetTimezone, machineTimezone } = getBoundedRandomTime(tz);
        return {
          timezone: tz,
          date: machineTimezone.toISOString(),
          localTime: targetTimezone.toISOString(),
        };
      }) satisfies TimezoneJobData[]);

  console.log("timezoneJobsData", timezoneJobsData);

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

if (require.main === module) {
  queueTimezoneJobs()
    .then(() => console.log("Timezone jobs queued successfully"))
    .catch((error) => console.error("Error queuing timezone jobs:", error))
    .finally(() => process.exit(0));
}
