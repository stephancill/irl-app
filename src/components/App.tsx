"use client";

import sdk from "@farcaster/frame-sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { getRelativeTime } from "../lib/utils";
import { useSession } from "../providers/SessionProvider";
import { Post } from "../types/post";
import { PostView } from "./PostView";
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
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}` : "/api/feed";
      const res = await fetch(url);
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  // Load more when bottom is visible
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading feed</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 bg-background z-50 p-4 border-b max-w-[400px] mx-auto w-full">
        <h1 className="text-xl font-bold">[redacted]</h1>
      </div>

      <div className="space-y-4 py-4 flex flex-col gap-4 max-w-[400px] mx-auto w-full">
        {data?.pages.map((page) =>
          page.posts?.map((post: PostResponse) => (
            <div key={post.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Avatar className="border">
                    <AvatarImage src="" />
                    <AvatarFallback>{post.fid}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-bold text-lg">{post.fid}</p>
                </div>
                <p className="text-sm text-muted-foreground">on time ⚡️</p>
              </div>
              <PostView post={post} initialView={post.primaryImage} />
            </div>
          ))
        )}

        {/* Loading indicator */}
        <div ref={ref} className="flex justify-center p-4">
          {isFetchingNextPage && <div>Loading more...</div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-50">
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
