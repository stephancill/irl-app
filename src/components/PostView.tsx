import { Post } from "../types/post";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PostViewProps {
  post: Post;
  initialView?: "front" | "back";
}

export function PostView({ post, initialView = "front" }: PostViewProps) {
  const [primaryImage, setPrimaryImage] = useState<"front" | "back">(
    initialView
  );
  const [isMainLoading, setIsMainLoading] = useState(true);
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(true);

  const mainImage =
    primaryImage === "front" ? post.frontImageUrl : post.backImageUrl;
  const thumbnailImage =
    primaryImage === "front" ? post.backImageUrl : post.frontImageUrl;

  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative w-full aspect-[3/4]">
        {isMainLoading && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-md" />
        )}
        <img
          src={mainImage}
          alt="Post"
          className="w-full h-full object-cover rounded-md"
          onLoad={() => setIsMainLoading(false)}
        />
      </div>

      {/* Thumbnail */}
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
    </div>
  );
}
