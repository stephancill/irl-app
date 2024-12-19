import { ANCHOR_TIMEZONES } from "../lib/constants";
import { alertsTimezonesQueue } from "../lib/queue";

// Mock the dependencies
jest.mock("../lib/queue");

describe("choose-times task", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should queue a job for each timezone", async () => {
    const now = Date.now();

    // Import the file to run the main function
    await import("../tasks/choose-times");

    // Check that addBulk was called once
    expect(alertsTimezonesQueue.addBulk).toHaveBeenCalledTimes(1);

    // Get the jobs that were passed to addBulk
    const jobs = (alertsTimezonesQueue.addBulk as jest.Mock).mock.calls[0][0];

    // Verify we have the correct number of jobs
    expect(jobs).toHaveLength(ANCHOR_TIMEZONES.length);

    // Log each job's times for debugging
    // jobs.forEach((job: any) => {
    //   const targetTime = new Date(now + job.opts.delay);

    //   console.log(
    //     `Job for ${job.name}:\n` +
    //       `System time:\t\t${targetTime.toLocaleString("en-US", {
    //         timeZone: "UTC",
    //       })}\n` +
    //       `Target timezone time:\t${targetTime.toLocaleString("en-US", {
    //         timeZone: job.data.timezone,
    //       })}`
    //   );
    // });

    // Verify each job has the correct structure and positive delay
    jobs.forEach((job: any, index: number) => {
      const timezone = ANCHOR_TIMEZONES[index];

      expect(job).toEqual({
        name: timezone,
        data: {
          timezone: timezone,
          date: expect.any(String),
        },
        opts: {
          delay: expect.any(Number),
        },
      });

      // Verify delay is positive
      expect(job.opts.delay).toBeGreaterThan(0);
    });
  });
});
