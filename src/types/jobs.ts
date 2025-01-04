export type TimezoneJobData = {
  /** Timezone of the anchor point */
  timezone: string;
  /** ISO string of the target time */
  date: string;
  /** ISO string of the time in the user's timezone */
  localTime: string;
};

export type AlertsBulkJobData = {
  notifications: {
    fid?: number;
    token: string;
  }[];
  url: string;
  title: string;
  body: string;
  targetUrl: string;
  notificationId?: string;
};

export type NewPostNotificationsJobData = {
  postId: string;
};
