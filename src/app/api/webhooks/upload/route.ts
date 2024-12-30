import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  // Get the signature and timestamp from headers
  const signature = request.headers.get("x-cld-signature");
  const timestamp = request.headers.get("x-cld-timestamp");

  // Get the raw body as text
  const bodyText = await request.text();

  // Verify the signature
  const isValid = cloudinary.utils.verifyNotificationSignature(
    bodyText,
    Number(timestamp),
    signature || ""
  );

  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the body after verification
  const body = JSON.parse(bodyText);

  let query = db
    .updateTable("posts")
    .where("id", "=", body.context.custom.postId)
    .where("userId", "=", body.context.custom.userId);

  if (body.context.custom.cameraType === "front") {
    query = query.set({
      frontImageUrl: body.secure_url,
    });
  } else {
    query = query.set({
      backImageUrl: body.secure_url,
    });
  }

  await query.execute();

  return Response.json({ success: true });
}
