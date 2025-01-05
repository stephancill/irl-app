import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ANCHOR_TIMEZONES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseGeo(geo: string) {
  const [lat, long] = geo.split("geo:")[1].split(",").map(parseFloat);
  return { lat, long };
}

export function determineTimezone(longitude: number): string {
  const longitudeBoundaries = [-180, -27, 34, 88, 180]; // Maps to ANCHOR_TIMEZONES

  const index = longitudeBoundaries.findIndex(
    (boundary) => longitude <= boundary
  );
  return ANCHOR_TIMEZONES[(index - 1) % ANCHOR_TIMEZONES.length];
}

export function getBoundedRandomTime(timezone: string): {
  targetTimezone: Date;
  machineTimezone: Date;
} {
  // Get timezone offset relative to system time
  const now = new Date();
  const nowInTargetTz = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );
  const offset = nowInTargetTz.getTime() - now.getTime();

  nowInTargetTz.setDate(nowInTargetTz.getDate() + 1);
  const tomorrowTarget = new Date(nowInTargetTz.getTime());

  // Set time between 9:00 and 23:59
  const minHour = 9;
  const maxHour = 23;
  const randomHour =
    Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;

  // Random minutes (0-59)
  const randomMinutes = Math.floor(Math.random() * 60);

  tomorrowTarget.setHours(randomHour, randomMinutes, 0, 0);

  const machineTimezone = new Date(tomorrowTarget.getTime() - offset);

  return {
    targetTimezone: tomorrowTarget,
    machineTimezone,
  };
}

export function getRelativeTime(d1: Date, d2: Date = new Date()): string {
  const units: Record<string, { value: number; short: string }> = {
    year: { value: 24 * 60 * 60 * 1000 * 365, short: "y" },
    month: { value: (24 * 60 * 60 * 1000 * 365) / 12, short: "mo" },
    day: { value: 24 * 60 * 60 * 1000, short: "d" },
    hour: { value: 60 * 60 * 1000, short: "h" },
    minute: { value: 60 * 1000, short: "m" },
    second: { value: 1000, short: "s" },
  };

  const elapsed = d1.getTime() - d2.getTime();

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (const [unit, { value, short }] of Object.entries(units)) {
    if (Math.abs(elapsed) > value || unit === "second") {
      const count = Math.round(elapsed / value);
      // const prefix = count >= 0 ? "" : "-";
      return `${Math.abs(count)}${short}`;
    }
  }

  return "0s";
}

export function objectToMetadataString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      // Convert value to string, handling arrays and other types
      const stringValue = Array.isArray(value)
        ? JSON.stringify(value)
        : String(value);

      // Escape special characters: |, =, and "
      const escapedKey = key.replace(/([|="\\])/g, "\\$1");
      const escapedValue = stringValue.replace(/([|="\\])/g, "\\$1");

      return `${escapedKey}=${escapedValue}`;
    })
    .join("|");
}

export function generateWarpcastComposeUrl(
  text: string,
  embeds: string[] = []
): string {
  const url = new URL("https://warpcast.com/~/compose");
  url.searchParams.append("text", text);

  embeds.forEach((embed) => {
    url.searchParams.append("embeds[]", embed);
  });

  return url.toString();
}
