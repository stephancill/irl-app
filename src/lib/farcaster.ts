import { Message, UserDataAddMessage, UserDataType } from "@farcaster/core";
import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { type User as NeynarUser } from "@neynar/nodejs-sdk/build/api";
import { getFidByUsernameKey, getMutualsKey, getUserDataKey } from "./keys";
import { redisCache, withCache } from "./redis";

export async function getUserData(fid: number) {
  const res = await fetch(`${process.env.HUB_URL}/v1/userDataByFid?fid=${fid}`);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch user data: ${res.statusText} (${res.status})`
    );
  }

  const data = (await res.json()) as { messages: any[] };

  const userData = data.messages.reduce<
    Record<UserDataType, string | undefined>
  >((acc, message) => {
    const decoded = Message.fromJSON(message) as UserDataAddMessage;

    acc[decoded.data.userDataBody.type] = decoded.data.userDataBody.value;
    return acc;
  }, {} as Record<UserDataType, string | undefined>);

  return userData;
}

export async function getFidByUsername(username: string) {
  const res = await fetch(
    `${process.env.HUB_URL}/v1/userNameProofByName?name=${username}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch fid by username: ${res.statusText}`);
  }

  const data: {
    fid: number | undefined;
  } = await res.json();

  if (!data.fid) {
    throw new Error(`Failed to fetch fid by username: ${username}`);
  }

  return data.fid;
}

export async function getFidsByUsernamesCached(
  usernames: string[]
): Promise<number[]> {
  const cachedFidsResponse = await redisCache.mget(
    usernames.map((username) => getFidByUsernameKey(username))
  );

  const uncachedUsernames = cachedFidsResponse
    .map((fid, index) => {
      if (!fid) {
        return usernames[index];
      }
    })
    .filter((username) => username !== undefined);

  const cachedFids = cachedFidsResponse
    .map((fid) => (fid ? parseInt(fid) : undefined))
    .filter((fid) => fid !== undefined);

  if (uncachedUsernames.length === 0) {
    return cachedFids;
  }

  const fidsWithUsernames = await Promise.all(
    uncachedUsernames.map(async (username) => {
      try {
        const fid = await getFidByUsername(username);
        return { fid, username };
      } catch (error) {
        console.error(`Failed to fetch fid for username: ${username}`, error);
        return { username, fid: null };
      }
    })
  );

  if (fidsWithUsernames.length > 0) {
    await redisCache.mset(
      fidsWithUsernames
        .map(({ fid, username }) => [
          getFidByUsernameKey(username),
          fid?.toString() ?? null,
        ])
        .flat()
    );

    let multi = redisCache.multi();
    for (const { username, fid } of fidsWithUsernames) {
      multi = multi.expire(
        getFidByUsernameKey(username),
        fid ? 60 * 60 * 24 * 30 : 60 * 60
      ); // 30 days if fid is not null, 1 hour if fid is null
    }
    await multi.exec();
  }

  return [...cachedFids, ...fidsWithUsernames.map(({ fid }) => fid)].filter(
    (fid) => fid !== null
  );
}

export async function getUserDatasCached(
  fids: number[]
): Promise<NeynarUser[]> {
  if (fids.length === 0) {
    return [];
  }

  const neynarClient = new NeynarAPIClient(
    new Configuration({
      apiKey: process.env.NEYNAR_API_KEY!,
    })
  );

  // Get users from cache
  const cachedUsersRes = await redisCache.mget(
    fids.map((fid) => getUserDataKey(fid))
  );
  const cachedUsers: NeynarUser[] = cachedUsersRes
    .filter((user) => user !== null)
    .map((user) => JSON.parse(user));

  // Users to fetch
  const cachedUserFids = new Set(cachedUsers.map((user) => user.fid));
  const uncachedFids = fids.filter((fid) => !cachedUserFids.has(fid));

  if (uncachedFids.length === 0) {
    return cachedUsers;
  }

  // TODO: Implement pagination
  if (uncachedFids.length > 100) {
    throw new Error("Can't fetch more than 100 users at a time");
  }

  const res = await neynarClient.fetchBulkUsers({ fids: uncachedFids });

  // Cache fetched users
  await redisCache.mset(
    res.users
      .map((user) => [getUserDataKey(user.fid), JSON.stringify(user)])
      .flat()
  );

  // Set expiration for all newly cached users
  let multi = redisCache.multi();
  for (const user of res.users) {
    multi = multi.expire(getUserDataKey(user.fid), 60 * 60 * 24 * 3); // 3 days
  }
  await multi.exec();

  return [...cachedUsers, ...res.users];
}

export async function getMutuals(fid: number): Promise<{ fid: number }[]> {
  const apiKey = process.env.QUOTIENT_API_KEY;
  if (!apiKey) {
    throw new Error("QUOTIENT_API_KEY environment variable is required");
  }

  const response = await fetch("https://api.quotient.social/v1/farcaster-users/mutuals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fid: fid,
      api_key: apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch mutuals: ${response.statusText} (${response.status})`);
  }

  const data = await response.json();
  
  // The API returns an object with mutual_followers array containing objects with fid, username, and pfp_url
  // We only need the fid property to match the expected return type
  if (!data.mutual_followers || !Array.isArray(data.mutual_followers)) {
    throw new Error("Invalid response format: missing mutual_followers array");
  }
  
  return data.mutual_followers.map((user: { fid: number; username: string; pfp_url: string }) => ({
    fid: user.fid,
  }));
}

export async function getMutualsCached(fid: number) {
  return withCache(getMutualsKey(fid), () => getMutuals(fid), {
    ttl: 60 * 60 * 24 * 7, // 1 week
  });
}

// export async function getMutuals(fid: number) {
//   const neynarClient = new NeynarAPIClient(
//     new Configuration({
//       apiKey: process.env.NEYNAR_API_KEY!,
//     })
//   );

//   const res = await neynarClient.fetchRelevantFollowers({
//     targetFid: fid,
//     viewerFid: fid,
//   });

//   const users = res.all_relevant_followers_dehydrated
//     .map((f) => f.user)
//     .filter((f) => f !== undefined);

//   return users;
// }
