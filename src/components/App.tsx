"use client";

import sdk from "@farcaster/frame-sdk";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getRelativeTime } from "../lib/utils";
import { useSession } from "../providers/SessionProvider";
import { Post } from "../types/post";
import { PostImage } from "./PostImage";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

type PostResponse = Post & {
  userId: string;
  fid: string;
  timezone: string;
};

interface FeedResponse {
  posts: PostResponse[];
  nextCursor: string | null;
}

export function App() {
  const { context } = useSession();

  const { data, isLoading, error } = useQuery<FeedResponse>({
    queryKey: ["feed"],
    queryFn: () => {
      return {
        posts: [
          {
            imageUrl: "/rick.jpg",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            id: "1",
            userId: "1",
            fid: "1",
            timezone: "America/New_York",
          },
          {
            imageUrl: "/rick.jpg",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            id: "2",
            userId: "2",
            fid: "2",
            timezone: "America/New_York",
          },
        ] as PostResponse[],
        nextCursor: null,
      };

      // return fetch("/api/feed").then((res) => res.json());
    },
    refetchInterval: 60 * 1000, // 1 minute
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading feed</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 bg-background z-10 p-4 border-b max-w-[400px] mx-auto w-full">
        <h1 className="text-xl font-bold">dailysnap</h1>
      </div>

      <div className="space-y-4 py-4 flex flex-col gap-4 max-w-[400px] mx-auto w-full">
        {data?.posts.map((post) => (
          <div key={post.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Avatar className="border">
                  <AvatarImage src={post.imageUrl} />
                  <AvatarFallback>{post.fid}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold text-lg">{post.fid}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {getRelativeTime(new Date(post.createdAt))}
              </p>
            </div>
            <PostImage src={post.imageUrl} alt="Post" />
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center">
        <div className="max-w-[400px] w-full">
          {!context?.client.added ? (
            <Button
              size={"lg"}
              className="text-lg p-4 w-full"
              onClick={() => {
                sdk.actions.addFrame();
              }}
            >
              install frame
            </Button>
          ) : (
            <Link href="/post" className="w-full">
              <Button size={"lg"} className="text-lg p-4 w-full">
                post
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
