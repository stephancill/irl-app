export const CHALLENGE_DURATION_SECONDS = 60;
export const AUTH_SESSION_COOKIE_NAME = "auth_session";

export const ANCHOR_TIMEZONES = [
  "America/New_York",
  "Europe/Paris",
  "Asia/Tehran",
  "Asia/Hovd",
];

export const ANCHOR_TIMEZONES_LABELS = {
  "America/New_York": "Americas",
  "Europe/Paris": "Europe",
  "Asia/Tehran": "West Asia",
  "Asia/Hovd": "East Asia",
};

// Jobs that queue alerts for a given timezone
export const ALERTS_TIMEZONES_QUEUE_NAME = "alerts-timezones";

// Jobs that alert users in bulk
export const ALERTS_BULK_QUEUE_NAME = "alerts-bulk";

// Jobs that alert users
export const ALERTS_QUEUE_NAME = "alerts";

// Jobs that notify users of new posts
export const NEW_POST_NOTIFICATIONS_QUEUE_NAME = "new-post-notifs";

// Jobs that notify users of new comments
export const NEW_COMMENT_NOTIFICATIONS_QUEUE_NAME = "new-comment-notifs";

export const FRAME_METADATA = {
  version: "next",
  imageUrl: `${process.env.APP_URL}/og.png`,
  button: {
    title: "launch irl",
    action: {
      type: "launch_frame",
      name: "irl",
      url: process.env.APP_URL,
      splashImageUrl: `${process.env.APP_URL}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};
