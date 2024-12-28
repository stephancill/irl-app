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
import { RefreshCw, Zap } from "lucide-react";
import Countdown, { zeroPad } from "react-countdown";

type PostResponse = Post & {
  userId: string;
  fid: string;
  timezone: string;
};

export function App() {
  const { context, user } = useSession();
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}` : "/api/feed";
      const res = await fetch(url);
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    retry: true,
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">[redacted]</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 py-4 flex flex-col gap-4 max-w-[400px] mx-auto w-full">
        {/* <pre>{JSON.stringify(context, null, 2)}</pre> */}

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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {getRelativeTime(new Date(post.createdAt))}
                  </p>
                  {post.postOnTime && (
                    <Zap fill="yellow" className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
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
                sdk.actions.addFrame().then((result) => {
                  alert(JSON.stringify(result, null, 2));
                });
              }}
            >
              add frame to post
            </Button>
          ) : (
            user &&
            user.latestAlertExpiry && (
              <Link href="/post" className="w-full">
                <Button
                  size={"lg"}
                  className="text-lg p-4 w-full"
                  disabled={user.postsRemaining <= 0}
                >
                  {user.postsRemaining <= 0 ? (
                    "already posted"
                  ) : (
                    <>
                      post{" "}
                      {user.postsToday >= 1
                        ? `again (${user.postsRemaining})`
                        : user.latestAlertTime && (
                            <Countdown
                              date={new Date(user.latestAlertExpiry)}
                              renderer={({ minutes, seconds }) => {
                                const targetTime = new Date(
                                  user.latestAlertExpiry!
                                ).getTime();
                                if (Date.now() > targetTime) {
                                  return "late";
                                }
                                return `${zeroPad(minutes)}:${zeroPad(
                                  seconds
                                )}`;
                              }}
                            ></Countdown>
                          )}
                    </>
                  )}
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
