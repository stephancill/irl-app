export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
  userId: string;
  userFid: number;
};

export type Post = {
  id: string;
  createdAt: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  primaryImage: "back" | "front";
  postOnTime: boolean;
  userId: string;
  fid: number;
  timezone: string;
  userStreak: number;
  comments: Comment[];
};
