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

// Jobs that alert users
export const ALERTS_BULK_QUEUE_NAME = "alerts-bulk";

export const FRAME_MANIFEST = {
  accountAssociation: {
    header:
      "eyJmaWQiOjE2ODksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzM4QjIxY0I5NTIwMzM4RjlBMzc1YzNiOTcxQjE3NzhhZTEwMDRhIn0",
    payload: "eyJkb21haW4iOiJzbmFwLnN0ZWVyLmZ1biJ9",
    signature:
      "MHg4NzcwNWVlMTY2YzI4YzFlODczYWM1YmJmZTliOTAxZWQzMTg5Y2FmZDYyZjFjNWQxNjdmOTQ5ZGYzNWIyNmIwMTIyMDkxY2M3OTM1ZTA1OTA2NjQ1M2NkOGVlNjUwMWM1OTlhZGRlZWIzZDBkNjczNTBiYjFhYzVhYTMwMTFhOTFi",
  },
  frame: {
    version: "1",
    name: "dailysnap",
    iconUrl: "https://snap.steer.fun/icon.png",
    homeUrl: "https://snap.steer.fun",
    imageUrl: "https://snap.steer.fun/image.png",
    buttonTitle: "Check this out",
    splashImageUrl: "https://snap.steer.fun/splash.png",
    splashBackgroundColor: "#eeccff",
    webhookUrl: "https://snap.steer.fun/api/webhooks/add-frame",
  },
} as const;
