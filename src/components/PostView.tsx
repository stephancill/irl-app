import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import sdk from "@farcaster/frame-sdk";
import { type UserDehydrated } from "@neynar/nodejs-sdk/build/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  EyeOff,
  Flame,
  Loader2,
  MoreVertical,
  SendHorizontal,
  Trash,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
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
import { Input } from "./ui/input";

interface PostViewProps {
  post: Post;
  users: Record<string, UserDehydrated>;
  onDelete?: () => void;
  commentsShown?: boolean;
  headerShown?: boolean;
}

export function PostView({
  post: initialPost,
  users: initialUsers,
  commentsShown = false,
  headerShown = true,
  onDelete,
}: PostViewProps) {
  const { user, authFetch } = useSession();
  const { toast } = useToast();

  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(commentsShown);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const {
    data: { post, users },
    refetch: refetchPost,
  } = useQuery({
    queryKey: ["post", initialPost.id],
    queryFn: async () => {
      const res = await authFetch(`/api/posts/${initialPost.id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      const postResponse = await res.json();
      return postResponse as {
        post: Post;
        users: Record<number, UserDehydrated>;
      };
    },
    enabled: shouldRefetch,
    initialData: { post: initialPost, users: initialUsers },
    refetchInterval: shouldRefetch ? 1000 : undefined,
  });

  const createComment = useMutation({
    mutationFn: async (comment: string) => {
      const res = await authFetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      setShowComments(true);
      void refetchPost();
      toast({
        description: "comment added successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "failed to add comment",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await authFetch(
        `/api/posts/${post.id}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: () => {
      void refetchPost();
    },
  });

  const [primaryImage, setPrimaryImage] = useState<"front" | "back">(
    initialPost.primaryImage
  );
  const [isMainLoading, setIsMainLoading] = useState(true);
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(true);

  const mainImage =
    primaryImage === "front" ? post.frontImageUrl : post.backImageUrl;
  const thumbnailImage =
    primaryImage === "front" ? post.backImageUrl : post.frontImageUrl;

  const placeholderClass = "w-full h-full bg-gray-200 rounded-md";

  const isPostReady = useMemo(() => {
    return post.frontImageUrl &&
      post.backImageUrl &&
      user !== undefined &&
      user !== null &&
      user.postsToday !== 0
      ? true
      : false;
  }, [post, user]);

  useEffect(() => {
    if (post.frontImageUrl && post.backImageUrl) {
      setShouldRefetch(false);
    } else if (user !== undefined && user !== null && user.postsToday > 0) {
      setShouldRefetch(true);
    }

    setPrimaryImage(post.primaryImage);
  }, [post, user]);

  useEffect(() => {
    refetchPost();
  }, [refetchPost]);

  return (
    <div className="flex flex-col gap-3">
      {headerShown && (
        <div className="flex items-center justify-between px-2">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              sdk.actions.viewProfile({
                fid: post.fid,
              });
            }}
          >
            <Avatar className={twMerge("border")}>
              <AvatarImage src={users[post.fid]?.pfp_url} />
              <AvatarFallback>{users[post.fid]?.username}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-lg">
                {users[post.fid]?.username}
              </p>
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
            {post.userId === user?.id && (
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
                        if (
                          confirm("are you sure you want to delete this post?")
                        ) {
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
            )}
          </div>
        </div>
      )}

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

      {/* Add comments section */}
      <div className="px-2 flex flex-col gap-2" id="comments">
        {post.comments.length > 0 && (
          <>
            <button
              className="text-sm text-muted-foreground text-left flex items-center gap-1"
              onClick={() => setShowComments(!showComments)}
            >
              <ChevronDown
                className={twMerge(
                  "h-4 w-4 transition-transform duration-200 rotate-[-90deg]",
                  showComments && "rotate-[0deg]"
                )}
              />
              {showComments
                ? "hide comments"
                : `show ${post.comments.length} comment${
                    post.comments.length > 1 ? "s" : ""
                  }`}
            </button>

            {showComments && (
              <div className="flex flex-col gap-2">
                {post.comments.map((comment) => {
                  const commentUser = users[comment.userFid];
                  const isDeleting = deleteComment.variables === comment.id;
                  return (
                    <div
                      key={comment.id}
                      className={twMerge(
                        "flex gap-2 group",
                        isDeleting && "opacity-50 pointer-events-none"
                      )}
                      id={`comment-${comment.id}`}
                    >
                      <Avatar
                        className="w-6 h-6 cursor-pointer"
                        onClick={() => {
                          sdk.actions.viewProfile({
                            fid: commentUser?.fid!,
                          });
                        }}
                      >
                        <AvatarImage src={commentUser?.pfp_url} />
                        <AvatarFallback>
                          {commentUser?.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="flex flex-col flex-1"
                        onClick={() => {
                          // Populate the text input with `@${commentUser?.username} and make it active`
                          setCommentText(`@${commentUser?.username} `);
                          commentInputRef.current?.focus();
                        }}
                      >
                        <div className="flex gap-2 items-center justify-between">
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium cursor-pointer">
                              {commentUser?.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(new Date(comment.createdAt))}
                            </span>
                          </div>
                          {comment.userId === user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "are you sure you want to delete this comment?"
                                      )
                                    ) {
                                      deleteComment.mutate(comment.id);
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
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 items-center">
          <Input
            ref={commentInputRef}
            placeholder="add a comment..."
            className={twMerge(
              "text-sm shadow-none",
              commentText.trim().length === 0 ? "border-none" : "border-b"
            )}
            value={commentText}
            disabled={createComment.isPending}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && commentText.trim()) {
                createComment.mutate(commentText.trim());
              }
            }}
          />
          {commentText.trim() && (
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0"
              disabled={!commentText.trim() || createComment.isPending}
              onClick={() => createComment.mutate(commentText.trim())}
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
