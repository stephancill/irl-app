export type TimezoneJobData = {
  /** Timezone of the anchor point */
  timezone: string;
  /** ISO string of the target time */
  date: string;
};

export type AlertsBulkJobData = {
  notifications: {
    fid: number;
    token: string;
  }[];
  url: string;
  alertId: number;
  chunkId: number;
};
