import { Message, UserDataAddMessage, UserDataType } from "@farcaster/core";

export async function getUserData(fid: string) {
  const res = await fetch(`${process.env.HUB_URL}/v1/userDataByFid?fid=${fid}`);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch user data: ${res.statusText} (${res.status})`
    );
  }

  const data = (await res.json()) as { messages: any[] };

  const userData = data.messages.reduce((acc, message) => {
    const decoded = Message.fromJSON(message) as UserDataAddMessage;

    acc[decoded.data.userDataBody.type] = decoded.data.userDataBody.value;
    return acc;
  }, {} as Record<UserDataType, string | undefined>);

  return userData;
}
