import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { db } from "./db";
import { FrameNotificationDetails } from "@farcaster/frame-node";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotifications({
  title,
  body,
  url,
  tokens,
  notificationId,
  targetUrl,
}: {
  /** The title of the notification - max 32 character */
  title: string;
  body: string;
  tokens: string[];
  /** The url to send the notification to */
  url: string;
  /** The url that will open when the notification is clicked */
  targetUrl: string;
  /** The id of the notification (defaults to a random uuid) */
  notificationId?: string;
}): Promise<SendFrameNotificationResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: notificationId || crypto.randomUUID(),
      title,
      body,
      targetUrl,
      tokens: tokens,
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      // Malformed response
      throw new Error("Malformed response");
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      // Rate limited
      throw new Error("Rate limited");
    }

    return { state: "success" };
  } else {
    // Error response
    const message = JSON.stringify(responseJson) || "Unknown error";
    throw new Error(message);
  }
}

export async function sendFrameNotification({
  title,
  body,
  targetUrl,
  notificationId,
  ...params
}: {
  title: string;
  body: string;
  targetUrl: string;
  notificationId?: string;
} & (
  | { fid: number }
  | {
      token: string;
      url: string;
    }
)) {
  let token: string;
  let url: string;

  if ("fid" in params) {
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("fid", "=", params.fid)
      .where("notificationUrl", "is not", null)
      .where("notificationToken", "is not", null)
      .executeTakeFirst();

    if (!user) {
      throw new Error("User not found");
    }

    token = user.notificationToken!;
    url = user.notificationUrl!;
  } else {
    token = params.token;
    url = params.url;
  }

  await sendFrameNotifications({
    title,
    body,
    url,
    targetUrl,
    tokens: [token],
    notificationId,
  });
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  // Update user notification details
  await db
    .updateTable("users")
    .set({
      notificationUrl: notificationDetails.url,
      notificationToken: notificationDetails.token,
    })
    .where("fid", "=", fid)
    .execute();
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await db
    .updateTable("users")
    .set({
      notificationUrl: null,
      notificationToken: null,
    })
    .where("fid", "=", fid)
    .execute();
}
