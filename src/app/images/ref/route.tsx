import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getCloudinaryProxyUrl } from "@/lib/cloudinary";
import { getUserDatasCached } from "@/lib/farcaster";

const size = {
  width: 600,
  height: 400,
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const fid = searchParams.get("fid") as string;

  const [farcasterUser] = await getUserDatasCached([parseInt(fid)]);

  if (!farcasterUser) {
    throw new Error(`User ${fid} not found`);
  }

  const transformedProfileImage = farcasterUser?.pfp_url
    ? getCloudinaryProxyUrl(farcasterUser.pfp_url, 300, 300)
    : undefined;

  const sourceSerif = await fetch(
    new URL("/SourceSerif4-Regular.ttf", process.env.APP_URL)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-white p-8">
        <div tw="flex flex-col items-center gap-4">
          <img
            src={transformedProfileImage}
            alt={farcasterUser.display_name}
            tw="w-24 h-24 rounded-full border-4 border-gray-200"
          />
          <p tw="text-5xl font-medium">@{farcasterUser.username} is on irl</p>
          <p tw="text-2xl text-gray-600 text-center">
            join them to post and see daily photos from your friends in the real
            world
          </p>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Source Serif 4",
          data: sourceSerif,
          style: "normal",
        },
      ],
    }
  );
}
