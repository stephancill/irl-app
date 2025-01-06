"use client";

import { Header } from "@/components/Header";
import { PostButton } from "@/components/PostButton";
import { PostView } from "@/components/PostView";
import { useSession } from "@/providers/SessionProvider";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Post } from "@/types/post";
import { UserDehydrated } from "@neynar/nodejs-sdk/build/api";

export default function PostDetail() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const { user, refetchUser, authFetch } = useSession();

  const {
    data: postResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["post", params.postId],
    queryFn: async () => {
      const res = await authFetch(`/api/posts/${params.postId}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error.toLowerCase());
      }
      const result = await res.json();
      return result as {
        post: Post;
        users: Record<number, UserDehydrated>;
      };
    },
    enabled: !!params.postId && !!user,
    retry: false,
  });

  useEffect(() => {
    refetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        <Header showBackButton />
        <div className="max-w-[400px] mx-auto w-full py-4 px-4">
          <div className="text-center text-gray-600">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header showBackButton />
      <div className="max-w-[400px] mx-auto w-full py-4">
        {postResponse && (
          <PostView
            post={postResponse.post}
            users={postResponse.users}
            onDelete={() => router.push("/")}
            commentsShown={true}
          />
        )}
      </div>
      {user?.postsToday === 0 && (
        <PostButton redirect={`/posts/${params.postId}`} />
      )}
    </div>
  );
}
