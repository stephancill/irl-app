import { Skeleton } from "@/components/ui/skeleton";
import sdk from "@farcaster/frame-sdk";
import { type UserDehydrated } from "@neynar/nodejs-sdk/build/api";
import {
  EyeOff,
  MoreVertical,
  Trash,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { getRelativeTime } from "../lib/utils";
import { Post } from "../types/post";
import { User } from "../types/user";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface PostViewProps {
  post: Post & {
    userId: string;
    fid: number;
    timezone: string;
  };
  user: User;
  postUser: UserDehydrated | null;
  onDelete?: () => void;
}

export function PostView({
  post,
  user,
  postUser: pageUser,
  onDelete,
}: PostViewProps) {
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Avatar className="border">
            <AvatarImage src={pageUser?.pfp_url} />
            <AvatarFallback>{pageUser?.username}</AvatarFallback>
          </Avatar>
          <p className="text-sm font-bold text-lg">{pageUser?.username}</p>
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
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  sdk.actions.openUrl(
                    `https://warpcast.com/${pageUser?.username}`
                  );
                }}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                View on Warpcast
              </DropdownMenuItem>
              {post.userId === user?.id && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    if (confirm("are you sure you want to delete this post?")) {
                      const res = await fetch(`/api/posts/${post.id}`, {
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
        {mainImage ? (
          <img
            src={mainImage}
            alt="Post"
            className="w-full h-full object-cover rounded-md"
            onLoad={() => setIsMainLoading(false)}
          />
        ) : (
          <div
            className={`${placeholderClass} flex flex-col items-center justify-center gap-2`}
          >
            <EyeOff className="w-6 h-6 text-gray-500" />
            <span className="text-gray-500 text-center">
              create a post to view other posts
            </span>
          </div>
        )}

        {thumbnailImage && (
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
