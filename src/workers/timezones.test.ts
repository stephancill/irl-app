import { TestDb, createTestDatabase } from "../lib/test-utils";
import { TimezoneJobData } from "../types/jobs";

// Mock the queue and redis modules
jest.mock("../lib/queue", () => ({
  alertsBulkQueue: {
    addBulk: jest.fn(),
  },
}));

jest.mock("../lib/redis", () => ({
  redis: {},
}));

// Import modules after mocking
const { timezonesWorker } = require("../workers/timezones");
const { alertsBulkQueue } = require("../lib/queue");
const { db } = require("../lib/db");

describe("timezonesWorker", () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    (db as jest.Mock).mockReturnValue(testDb.db);

    jest.mock("../lib/db", () => ({
      db: jest.fn(),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process timezone job and create bulk alert jobs", async () => {
    // Setup test data
    const testDate = new Date();
    const testTimezone = "America/New_York";

    // Create test users in the database
    await testDb.db
      .insertInto("users")
      .values([
        {
          fid: "1",
          timezone: testTimezone,
          notificationToken: "token1",
          notificationUrl: "https://example.com/notifications",
        },
        {
          fid: "2",
          timezone: testTimezone,
          notificationToken: "token2",
          notificationUrl: "https://example.com/notifications",
        },
      ])
      .execute();

    const jobData: TimezoneJobData = {
      timezone: testTimezone,
      date: testDate.toISOString(),
    };

    // Process the job
    await timezonesWorker.processJob({
      data: jobData,
      id: "test-job",
      name: testTimezone,
    } as any);

    // Verify post alert was created
    const postAlert = await testDb.db
      .selectFrom("postAlerts")
      .selectAll()
      .where("timezone", "=", testTimezone)
      .executeTakeFirst();

    expect(postAlert).toBeTruthy();
    expect(postAlert?.timezone).toBe(testTimezone);
    expect(new Date(postAlert!.timeUtc).getTime()).toBe(testDate.getTime());

    // Verify bulk jobs were created
    expect(alertsBulkQueue.addBulk).toHaveBeenCalledTimes(1);

    const bulkJobs = (alertsBulkQueue.addBulk as jest.Mock).mock.calls[0][0];
    expect(bulkJobs).toHaveLength(1); // One chunk since we have < 100 users

    const firstJob = bulkJobs[0];
    expect(firstJob.name).toBe(`${postAlert!.id}-0`);
    expect(firstJob.data.alertId).toBe(postAlert!.id);
    expect(firstJob.data.notifications).toHaveLength(2);
    expect(firstJob.data.notifications[0].fid).toBe(1);
    expect(firstJob.data.notifications[1].fid).toBe(2);
  });

  it("should handle empty user list", async () => {
    const testDate = new Date();
    const testTimezone = "Europe/London";

    const jobData: TimezoneJobData = {
      timezone: testTimezone,
      date: testDate.toISOString(),
    };

    await timezonesWorker.processJob({
      data: jobData,
      id: "test-job",
      name: testTimezone,
    } as any);

    // Verify post alert was still created
    const postAlert = await testDb.db
      .selectFrom("postAlerts")
      .selectAll()
      .where("timezone", "=", testTimezone)
      .executeTakeFirst();

    expect(postAlert).toBeTruthy();

    // Verify no bulk jobs were created
    expect(alertsBulkQueue.addBulk).toHaveBeenCalledWith([]);
  });
});
