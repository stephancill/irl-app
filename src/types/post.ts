export type Post = {
  id: string;
  createdAt: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  primaryImage: "back" | "front";
  postOnTime: boolean;
};
