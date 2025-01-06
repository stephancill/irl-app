import { Skeleton } from "@/components/ui/skeleton";
import sdk from "@farcaster/frame-sdk";
import { type UserDehydrated } from "@neynar/nodejs-sdk/build/api";
import { useQuery } from "@tanstack/react-query";
import {
  EyeOff,
  MoreVertical,
  Trash,
  User as UserIcon,
  Zap,
  Flame,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getRelativeTime } from "../lib/utils";
import { useSession } from "../providers/SessionProvider";
import { Post } from "../types/post";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { twMerge } from "tailwind-merge";

interface PostViewProps {
  post: Post;
  postUser: UserDehydrated | null;
  onDelete?: () => void;
}

export function PostView({
  post: initialPost,
  postUser,
  onDelete,
}: PostViewProps) {
  const { user, authFetch } = useSession();

  const [shouldRefetch, setShouldRefetch] = useState(false);

  const { data: post } = useQuery({
    queryKey: ["post", initialPost.id],
    queryFn: async () => {
      const res = await authFetch(`/api/posts/${initialPost.id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      const { post } = await res.json();
      return post as Post;
    },
    enabled: shouldRefetch,
    initialData: initialPost,
    refetchInterval: shouldRefetch ? 1000 : undefined,
  });

  const [primaryImage, setPrimaryImage] = useState<"front" | "back">(
    post.primaryImage
  );
  const [isMainLoading, setIsMainLoading] = useState(true);
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(true);

  const mainImage =
    primaryImage === "front" ? post.frontImageUrl : post.backImageUrl;
  const thumbnailImage =
    primaryImage === "front" ? post.backImageUrl : post.frontImageUrl;

  const placeholderClass = "w-full h-full bg-gray-200 rounded-md";

  const isPostReady = useMemo(() => {
    return (
      post.frontImageUrl &&
      post.backImageUrl &&
      user !== undefined &&
      user?.postsToday !== 0
    );
  }, [post, user]);

  useEffect(() => {
    if (post.frontImageUrl && post.backImageUrl) {
      setShouldRefetch(false);
    } else {
      setShouldRefetch(true);
    }
  }, [post]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2">
        <div
          className="flex items-center gap-2"
          onClick={() => {
            sdk.actions.viewProfile({
              fid: postUser?.fid!,
            });
          }}
        >
          <Avatar className={twMerge("border")}>
            <AvatarImage src={postUser?.pfp_url} />
            <AvatarFallback>{postUser?.username}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-lg">{postUser?.username}</p>
            {post.userStreak > 1 && (
              <div className="bg-yellow-400 rounded-full py-0.5 px-1 flex items-center justify-center">
                <Flame className="w-3 h-3 text-white fill-current" />
                <span className="text-[10px] font-bold text-white ml-0.5 pr-0.5">
                  {post.userStreak}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {post.createdAt ? getRelativeTime(new Date(post.createdAt)) : ""}
          </p>
          {post.postOnTime && (
            <Zap fill="yellow" className="h-4 w-4 text-yellow-400" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {post.userId === user?.id && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    if (confirm("are you sure you want to delete this post?")) {
                      const res = await authFetch(`/api/posts/${post.id}`, {
                        method: "DELETE",
                      });
                      if (res.ok && onDelete) {
                        onDelete();
                      }
                    }
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main image */}
      <div className="relative w-full aspect-[3/4]">
        {isMainLoading && mainImage && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-md" />
        )}
        {isPostReady && mainImage ? (
          <img
            src={mainImage}
            alt="Post"
            className="w-full h-full object-cover rounded-md"
            onLoad={() => setIsMainLoading(false)}
          />
        ) : user?.postsToday === 0 ? (
          <div
            className={twMerge(
              placeholderClass,
              "flex flex-col items-center justify-center gap-2"
            )}
          >
            <EyeOff className="w-6 h-6 text-gray-500" />
            <span className="text-gray-500 text-center">
              create a post to view other posts
            </span>
          </div>
        ) : (
          <div
            className={twMerge(
              placeholderClass,
              "flex flex-col items-center justify-center gap-2"
            )}
          >
            <span className="text-gray-500 text-center">processing...</span>
          </div>
        )}

        {isPostReady && thumbnailImage && (
          <button
            onClick={() =>
              setPrimaryImage(primaryImage === "front" ? "back" : "front")
            }
            className="absolute top-4 right-4 z-10 bg-white/80 p-1 rounded-lg backdrop-blur-sm"
          >
            <div className="relative w-24">
              {isThumbnailLoading && (
                <Skeleton className="absolute inset-0 w-full aspect-[3/4] rounded-md" />
              )}
              <img
                src={thumbnailImage}
                alt="Alternate view"
                className="w-24 rounded-md"
                onLoad={() => setIsThumbnailLoading(false)}
              />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
