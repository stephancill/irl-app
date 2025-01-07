import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { useSession } from "../providers/SessionProvider";
import { Post } from "../types/post";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { PostView } from "./PostView";
import type { UserDehydrated } from "@neynar/nodejs-sdk/build/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { ChevronLeft } from "lucide-react";

type PostsResponse = {
  groupedPosts: {
    [date: string]: Post[];
  };
  users: Record<number, UserDehydrated>;
};

export function PostsCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { authFetch } = useSession();

  const { data } = useQuery({
    queryKey: ["calendar-posts", format(date, "yyyy-MM")],
    queryFn: async () => {
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");
      const res = await authFetch(`/api/posts?start=${start}&end=${end}`);

      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data: PostsResponse = await res.json();
      return data;
    },
  });

  const { groupedPosts: posts, users } = data ?? {};

  return (
    <>
      {selectedPost ? (
        <div className="space-y-4 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          {users && (
            <Carousel className="w-full">
              <CarouselContent>
                {posts?.[
                  format(new Date(selectedPost.createdAt), "yyyy-MM-dd")
                ]?.map((post) => (
                  <CarouselItem key={post.id} className="flex justify-center">
                    <div className="w-full max-w-sm px-4">
                      <PostView
                        post={post}
                        users={users}
                        onDelete={() => setSelectedPost(null)}
                        headerShown={false}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      ) : (
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            if (date) {
              setDate(date);
              const dateStr = format(date, "yyyy-MM-dd");
              const dayPosts = posts?.[dateStr] || [];
              if (dayPosts.length > 0) {
                setSelectedPost(dayPosts[0]);
              }
            }
          }}
          modifiers={{
            hasPost: (date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              return !!posts?.[dateStr]?.length;
            },
          }}
          modifiersStyles={{
            hasPost: {
              position: "relative",
            },
          }}
          components={{
            DayContent: ({ date }) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayPosts = posts?.[dateStr] || [];
              const firstPost = dayPosts[0];

              return (
                <div className="w-full h-full relative p-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {date.getDate()}
                  </div>
                  {firstPost?.backImageUrl && (
                    <div className="absolute inset-0 rounded-md overflow-hidden opacity-40">
                      <Image
                        key={firstPost.backImageUrl}
                        src={firstPost.backImageUrl}
                        alt="post image"
                        fill
                        className="object-cover"
                        priority={false}
                        loading="lazy"
                      />
                    </div>
                  )}
                  {dayPosts.length > 1 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium">
                      {dayPosts.length}
                    </div>
                  )}
                </div>
              );
            },
          }}
        />
      )}
    </>
  );
}
