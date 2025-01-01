import { determineTimezone, getBoundedRandomTime } from "./utils";

describe("determineTimezone", () => {
  test("should return correct timezone for Americas", () => {
    expect(determineTimezone(-100)).toBe("America/New_York");
  });

  test("should return correct timezone for Europe/Africa", () => {
    expect(determineTimezone(0)).toBe("Europe/Paris");
  });

  test("should return correct timezone for East Asia", () => {
    expect(determineTimezone(50)).toBe("Asia/Tehran");
  });

  test("should return correct timezone for West Asia", () => {
    expect(determineTimezone(100)).toBe("Asia/Hovd");
  });
});

describe("getBoundedRandomTime", () => {
  it("should return a date object", () => {
    const result = getBoundedRandomTime("America/New_York");
    expect(result).toBeInstanceOf(Date);
  });

  it("should return a time between 9:00 and 23:59", () => {
    const timeZone = "America/New_York";
    const { machineTimezone: result } = getBoundedRandomTime(timeZone);

    // Convert to timezone-specific time for checking hours
    const timeInZone = new Date(result.toLocaleString("en-US", { timeZone }));
    const hours = timeInZone.getHours();

    expect(hours).toBeGreaterThanOrEqual(9);
    expect(hours).toBeLessThanOrEqual(23);
  });

  it("should return a date for tomorrow", () => {
    const timeZone = "America/New_York";
    const { machineTimezone: result } = getBoundedRandomTime(timeZone);
    const now = new Date();

    // Convert both dates to timezone-specific time for comparison
    const timeInZone = new Date(result.toLocaleString("en-US", { timeZone }));
    const nowInZone = new Date(now.toLocaleString("en-US", { timeZone }));

    expect(timeInZone.getDate()).toBe(nowInZone.getDate() + 1);
  });
});
