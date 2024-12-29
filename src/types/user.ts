export type User = {
  id: string;
  fid: number;
  timezone: string | null;
  latestAlertId: number | null;
  latestAlertTime: Date | null;
  latestAlertExpiry: Date | null;
  postsRemaining: number;
  postsToday: number;
};
