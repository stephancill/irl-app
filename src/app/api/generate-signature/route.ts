import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postsAllowanceDetails } from "@/lib/posts";
import { objectToMetadataString } from "@/lib/utils";
import { v2 as cloudinary } from "cloudinary";
import { sql } from "kysely";
import { NextResponse } from "next/server";
import { latestPostAlert } from "@/lib/queries";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = withAuth(async (req, user) => {
  const primaryType = req.nextUrl.searchParams.get("primaryType");

  if (!primaryType || !["front", "back"].includes(primaryType)) {
    console.error("Primary type is required ('front' or 'back')", {
      primaryType,
    });
    return NextResponse.json(
      { error: "Primary type is required ('front' or 'back')" },
      { status: 400 }
    );
  }

  // Get the latest post alert for the user
  const dbUser = await db
    .selectFrom("users")
    .leftJoin(latestPostAlert.as("latestAlert"), (join) =>
      join.onRef("latestAlert.timezone", "=", "users.timezone")
    )
    .select([
      "latestAlert.id as postAlertId",
      sql<Date>`latest_alert.time_utc + INTERVAL '5 MINUTES'`.as(
        "latestAlertExpiry"
      ),
    ])
    .where("users.id", "=", user.id)
    .executeTakeFirstOrThrow();

  if (!dbUser.postAlertId) {
    throw new Error(`No post alerts found for user ${JSON.stringify(user)}`);
  }

  const allowanceDetails = await postsAllowanceDetails(
    user.id,
    dbUser.postAlertId,
    dbUser.latestAlertExpiry
  );

  if (allowanceDetails.postsRemaining <= 0) {
    console.error("User cannot post", allowanceDetails);
    return NextResponse.json({ error: "User cannot post" }, { status: 400 });
  }

  const { id: postId } = await db
    .insertInto("posts")
    .values({
      userId: user.id,
      primaryImage: primaryType as "front" | "back",
      postAlertId: dbUser.postAlertId,
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
