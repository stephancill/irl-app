import { Generated } from "kysely";

export type UserRow = {
  id: Generated<string>;
  fid: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  locationLongitude: number | null;
  locationLatitude: number | null;
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

export type Tables = {
  users: UserRow;
  userSession: UserSessionRow;
  posts: PostRow;
};
