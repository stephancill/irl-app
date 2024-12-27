import { withAuth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { objectToMetadataString } from "../../../lib/utils";
import { db } from "../../../lib/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const GET = withAuth(async (req, user) => {
  const primaryType = req.nextUrl.searchParams.get("primaryType");

  if (!primaryType || !["front", "back"].includes(primaryType)) {
    return NextResponse.json(
      { error: "Primary type is required ('front' or 'back')" },
      { status: 400 }
    );
  }

  const { id: postId } = await db
    .insertInto("posts")
    .values({
      userId: user.id,
      primaryImage: primaryType as "front" | "back",
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  const [front, back] = ["front", "back"].map((cameraType) => {
    const params: Parameters<typeof cloudinary.utils.api_sign_request>[0] = {
      timestamp: Math.round(new Date().getTime() / 1000),
      folder: "snaps-uploads",
      transformation: "c_limit,w_800",
      context: objectToMetadataString({
        userId: user.id,
        cameraType,
        postId,
      }),
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      signature,
      params,
    };
  });

  return NextResponse.json({
    front,
    back,
    cloudname: process.env.CLOUDINARY_CLOUD_NAME,
    apikey: process.env.CLOUDINARY_API_KEY,
    postId,
  });
});
