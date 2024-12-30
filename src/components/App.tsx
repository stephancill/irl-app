"use client";

import sdk from "@farcaster/frame-sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { getRelativeTime } from "../lib/utils";
import { useSession } from "../providers/SessionProvider";
import { Post } from "../types/post";
import { PostView } from "./PostView";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  RefreshCw,
  Zap,
  TreeDeciduous,
  MoreVertical,
  Trash,
} from "lucide-react";
import Countdown, { zeroPad } from "react-countdown";
import { useToast } from "../hooks/use-toast";
import { type UserDehydrated } from "@neynar/nodejs-sdk/build/api";
import { Logo } from "./Logo";
import { useWaitForNotifications } from "../hooks/use-wait-for-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type PostResponse = Post & {
  userId: string;
  fid: number;
  timezone: string;
};

type FeedResponse = {
  posts: PostResponse[];
  nextCursor: string;
  users: Record<number, UserDehydrated>;
};

export function App() {
  const {
    context,
    user,
    refetchUser,
    isLoading: sessionLoading,
  } = useSession();
  const { ref, inView } = useInView();
  const { toast } = useToast();
  const { mutate: waitForNotifications } = useWaitForNotifications();

  // TODO: Live refresh
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
      const data = await res.json();
      return data;
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

  useEffect(() => {
    refetchUser();
  }, []);

  if (isLoading || sessionLoading)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  if (error) return <div>Error loading feed</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 bg-background z-50 p-4 border-b max-w-[400px] mx-auto w-full">
        <div className="flex items-center justify-between">
          <Logo />
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
        {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
        {!data?.pages[0]?.posts?.length ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center flex-1 min-h-[50vh]">
            <TreeDeciduous className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              no posts yet
            </p>
            <p className="text-sm text-muted-foreground">
              be the first to post!
            </p>
          </div>
        ) : (
          <>
            {data?.pages.map((page: FeedResponse) =>
              page.posts?.map((post: PostResponse) => (
                <div key={post.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="border">
                        <AvatarImage src={page.users[post.fid]?.pfp_url} />
                        <AvatarFallback>
                          {page.users[post.fid]?.username}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-bold text-lg">
                        {page.users[post.fid]?.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {getRelativeTime(new Date(post.createdAt))}
                      </p>
                      {post.postOnTime && (
                        <Zap
                          fill="yellow"
                          className="h-4 w-4 text-yellow-400"
                        />
                      )}
                      {post.userId === user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this post?"
                                  )
                                ) {
                                  const res = await fetch(
                                    `/api/posts/${post.id}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );
                                  if (res.ok) {
                                    refetch();
                                    refetchUser();
                                    toast({
                                      title: "Post deleted",
                                      description: "Your post has been deleted",
                                    });
                                  }
                                }
                              }}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <PostView post={post} initialView={post.primaryImage} />
                </div>
              ))
            )}
          </>
        )}

        {/* Loading indicator */}
        <div ref={ref} className="flex justify-center p-4">
          {isFetchingNextPage && <div>Loading more...</div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-50">
        <div className="max-w-[400px] w-full">
          {!context?.client.added && !user?.notificationsEnabled ? (
            <Button
              size={"lg"}
              className="text-lg p-4 w-full"
              onClick={() => {
                sdk.actions.addFrame().then((result) => {
                  if (result.added) {
                    waitForNotifications(void 0, {
                      onSuccess: () => {
                        toast({
                          title: "frame added",
                          description: "you can now post",
                        });
                      },
                      onError: () => {
                        toast({
                          title: "error",
                          description: "error adding frame",
                          variant: "destructive",
                        });
                      },
                    });
                  }
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
                  className="w-full"
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
