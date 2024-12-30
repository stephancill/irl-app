import { ImageResponse } from "next/og";
import { Logo } from "../components/Logo";

export const runtime = "edge";

export const alt = "Hello Frame";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-white">
        <Logo />
        <p tw="text-sm text-muted-foreground">
          daily photos from the real world
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
