import { useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface PostImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function PostImage({ src, alt = "", className = "" }: PostImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative aspect-square w-full">
      {isLoading && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover border ${className}`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
