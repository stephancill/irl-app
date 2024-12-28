export type Post = {
  id: string;
  createdAt: string;
  frontImageUrl: string;
  backImageUrl: string;
  primaryImage: "back" | "front";
  postOnTime: boolean;
};
