import { Generated } from "kysely";

export type UserRow = {
  id: Generated<string>;
  fid: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timezone: string | null;
  notificationUrl: string | null;
  notificationToken: string | null;
};

export interface UserSessionRow {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface PostRow {
  id: Generated<string>;
  userId: string;
  imageId: string | null;
  imageUrl: string;
  createdAt: Generated<Date>;
  expiresAt: Date;
  deletedAt: Date | null;
}

export interface PostAlertRow {
  id: Generated<number>;
  timeUtc: Date;
  timezone: string;
}

export type Tables = {
  users: UserRow;
  userSession: UserSessionRow;
  posts: PostRow;
  postAlerts: PostAlertRow;
};
