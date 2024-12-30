export const CHALLENGE_DURATION_SECONDS = 60;
export const AUTH_SESSION_COOKIE_NAME = "auth_session";

export const ANCHOR_TIMEZONES = [
  "America/New_York",
  "Europe/Paris",
  "Asia/Tehran",
  "Asia/Hovd",
];

// Jobs that queue alerts for a given timezone
export const ALERTS_TIMEZONES_QUEUE_NAME = "alerts-timezones";

// Jobs that alert users in bulk
export const ALERTS_BULK_QUEUE_NAME = "alerts-bulk";

// Jobs that alert users
export const ALERTS_QUEUE_NAME = "alerts";
