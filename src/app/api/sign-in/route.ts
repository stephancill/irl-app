import { lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserData } from "@/lib/farcaster";
import { redisCache } from "@/lib/redis";
import { determineTimezone, parseGeo } from "@/lib/utils";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import { UserDataType } from "@farcaster/core";
import { NextRequest } from "next/server";

const selectUser = db.selectFrom("users").selectAll();

export async function POST(req: NextRequest) {
  const { message, signature, challengeId, referrerId } = await req.json();

  if (!signature || !challengeId || !message) {
    console.error("Missing required fields", {
      signature,
      challengeId,
      message,
    });
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const challenge = await redisCache.get(`challenge:${challengeId}`);

  if (!challenge) {
    console.error("Challenge not found", { challengeId });
    return Response.json({ error: "Challenge not found" }, { status: 400 });
  }

  const appClient = createAppClient({
    ethereum: viemConnector(),
  });

  const verifyResponse = await appClient.verifySignInMessage({
    message,
    signature,
    domain: new URL(process.env.APP_URL ?? "").hostname,
    nonce: challenge,
  });

  if (!verifyResponse.success) {
    console.error("Invalid signature", { verifyResponse });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const fid = verifyResponse.fid;

  let dbUser;

  // Check if the fid is already registered
  const existingUser = await selectUser
    .where("fid", "=", fid)
    .executeTakeFirst();

  if (existingUser) {
    dbUser = existingUser;

    // Check if timezone has been set on protocol if not in db
    if (!existingUser.timezone) {
      const userData = await getUserData(fid);

      if (userData[UserDataType.LOCATION]) {
        const geo = parseGeo(userData[UserDataType.LOCATION]);
        const timezone = determineTimezone(geo.long);
        const updatedUser = await db
          .updateTable("users")
          .set({ timezone })
          .where("id", "=", existingUser.id)
          .returningAll()
          .executeTakeFirst();

        if (!updatedUser) {
          throw new Error("Failed to update user");
        }

        // Get the user with the alert after creation
        dbUser = await selectUser
          .where("id", "=", updatedUser.id)
          .executeTakeFirst();
      }
    }
  } else {
    // Create user
    try {
      // Get user data from hub
      const userData = await getUserData(fid);

      let timezone: string | null = null;

      if (userData[UserDataType.LOCATION]) {
        const geo = parseGeo(userData[UserDataType.LOCATION]);
        timezone = determineTimezone(geo.long);
      }

      // Create the new user
      const newUser = await db
        .insertInto("users")
        .values({
          fid,
          timezone,
          newPostNotifications: true,
        })
        .returningAll()
        .executeTakeFirst();

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      dbUser = newUser;

      if (referrerId) {
        await db
          .insertInto("referrals")
          .values({
            referrerId,
            referredId: newUser.id,
          })
          .execute();

        // Get the user with the alert after creation
        dbUser = await selectUser
          .where("users.id", "=", newUser.id)
          .executeTakeFirst();

        if (!dbUser) {
          throw new Error("Failed to create user");
        }
      }
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ error: "Failed to create user" }, { status: 500 });
    }
  }

  if (!dbUser) {
    console.error("No db user found");
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  const session = await lucia.createSession(dbUser!.id, {});

  return Response.json(
    {
      success: true,
      session,
    },
    {
      headers: {
        "Set-Cookie": lucia.createSessionCookie(session.id).serialize(),
      },
    }
  );
}
