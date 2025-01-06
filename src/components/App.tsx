"use client";

import { Header } from "@/components/Header";
import sdk from "@farcaster/frame-sdk";
import { type UserDehydrated } from "@neynar/nodejs-sdk/build/api";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  Bell,
  Info,
  RefreshCw,
  Settings,
  TreeDeciduous,
  UserPlus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useToast } from "../hooks/use-toast";
import { generateWarpcastComposeUrl } from "../lib/utils";
import { useSession } from "../providers/SessionProvider";
import { Post } from "../types/post";
import { PostButton } from "./PostButton";
import { PostView } from "./PostView";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./ui/menubar";
import { Switch } from "./ui/switch";
import { twMerge } from "tailwind-merge";

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
    authFetch,
  } = useSession();
  const { ref, inView } = useInView();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // TODO: Live refresh
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}` : "/api/feed";
      const res = await authFetch(url);
      const data = await res.json();
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled: !!user && !!user.timezone,
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

  // Add effect to check for share intent
  useEffect(() => {
    if (searchParams.get("intent") === "share") {
      setShowShareModal(true);
    }
  }, [searchParams]);

  // Add effect to handle tap count
  useEffect(() => {
    if (tapCount === 10) {
      setDebugMode(true);
      toast({
        title: "Debug mode enabled",
        description: "User debug information is now visible",
      });
    }
  }, [tapCount]);

  const { mutate: updateNotifications, isPending: isUpdatingNotifications } =
    useMutation({
      mutationFn: (enabled: boolean) =>
        authFetch("/api/user/notifications", {
          method: "PATCH",
          body: JSON.stringify({ postNotificationsEnabled: enabled }),
        }),
      onSuccess: () => {
        refetchUser();
      },
    });

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
      <Header onClick={() => setTapCount((count) => count + 1)}>
        <div className="flex items-center gap-1">
          <Menubar className="border-none p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger asChild className="cursor-pointer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  title="settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setShowRulesModal(true)}>
                  <Info className="h-4 w-4 mr-2" />
                  how it works
                </MenubarItem>
                <MenubarItem onClick={() => setShowShareModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  invite
                </MenubarItem>
                <MenubarItem onClick={() => setShowNotificationModal(true)}>
                  <Bell className="h-4 w-4 mr-2" />
                  notifications
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground"
            title="refresh feed"
          >
            <RefreshCw
              className={twMerge("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </Header>
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>invite your friends</DialogTitle>
            <DialogDescription>
              would you like to create a cast to invite your friends?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(getReferralLink(user?.id));
                toast({
                  title: "link copied",
                  description: "referral link copied to clipboard",
                });
                setShowShareModal(false);
              }}
            >
              copy link
            </Button>
            <Button
              onClick={() => {
                const url = generateWarpcastComposeUrl("join me on irl!", [
                  getReferralLink(user?.id),
                ]);
                sdk.actions.openUrl(url);
                setShowShareModal(false);
              }}
            >
              draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>notification settings</DialogTitle>
            <DialogDescription>
              customize which notifications you'd like to receive
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="newPosts">new posts</label>
              <Switch
                id="newPosts"
                checked={user?.postNotificationsEnabled}
                onCheckedChange={(checked) => {
                  updateNotifications(checked);
                }}
                disabled={isUpdatingNotifications}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRulesModal} onOpenChange={setShowRulesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>how it works</DialogTitle>
          </DialogHeader>
          <ul className="list-disc pl-4 space-y-2">
            <li>you can only see posts from mutuals from the past 24 hours</li>
            <li>
              you'll receive a notification at a random time every day to post
              (based on your location, there are 4 timezones)
            </li>
            <li>
              if you post within 5 minutes of the notification you can post 2
              more times that day
            </li>
            <li>you can only view other people's posts after you've posted</li>
            <li>you can always post late</li>
          </ul>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 py-4 flex flex-col gap-4 max-w-[400px] mx-auto w-full">
        {debugMode && (
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(user, null, 2)}
            {JSON.stringify(context, null, 2)}
          </pre>
        )}
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
                <PostView
                  key={post.id}
                  post={post}
                  postUser={page.users[post.fid]}
                  onDelete={() => {
                    refetch();
                    refetchUser();
                    toast({
                      title: "post deleted",
                      description: "your post has been deleted",
                    });
                  }}
                />
              ))
            )}
          </>
        )}

        {/* Loading indicator */}
        <div ref={ref} className="flex justify-center p-4">
          {isFetchingNextPage && <div>Loading more...</div>}
        </div>
      </div>

      <PostButton />
    </div>
  );
}

function getReferralLink(userId?: string) {
  if (!userId) return window.location.origin;
  return `${window.location.origin}?ref=${userId}`;
}
