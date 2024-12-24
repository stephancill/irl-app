import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";

export async function _sendNotifications(requestBody: {
  data: {
    targetUrl: string;
    tokens: string[];
    title: string;
    body: string;
    notificationId?: string;
  };
}) {
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.SEND_NOTIFICATIONS
  ) {
    return;
  }

  const response = await fetch(
    "https://api.warpcast.com/v1/frame-notifications",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: requestBody.data.notificationId ?? crypto.randomUUID(),
        title: requestBody.data.title,
        body: requestBody.data.body,
        targetUrl: requestBody.data.targetUrl,
        tokens: requestBody.data.tokens,
      } satisfies SendNotificationRequest),
    }
  );

  const responseJson = await response.json();

  if (response.status === 200) {
    // Ensure correct response
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      throw new Error(`Invalid response: ${responseBody.error.errors}`);
    }

    // Fail when rate limited
    if (responseBody.data.result.rateLimitedTokens.length) {
      throw new Error("Rate limited");
    }

    return Response.json({ success: true });
  } else {
    throw new Error(
      `Request failed: ${JSON.stringify(responseJson)} (${response.status})`
    );
  }
}
