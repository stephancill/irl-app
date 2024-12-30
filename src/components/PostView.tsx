import { Post } from "../types/post";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EyeOff } from "lucide-react";

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

  const placeholderClass = "w-full h-full bg-gray-200 rounded-md";

  return (
    <div className="relative">
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
      </div>

      {/* Thumbnail */}
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
  );
}
