import { lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getUserData } from "../../../lib/farcaster";
import { determineTimezone, parseGeo } from "../../../lib/utils";
import { User } from "../../../types/user";
import { UserDataType } from "@farcaster/core";

export async function GET(req: NextRequest) {
  // TODO: Frames v2 tokens not yet implemented, so will just be the fid
  const token = lucia.readBearerToken(req.headers.get("Authorization") ?? "");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Exchange token for fid
  const fid = await exchangeTokenForFid(token);

  let user: User | undefined;

  // Check if the fid is already registered
  const existingUser = await db
    .selectFrom("users")
    .where("fid", "=", fid)
    .selectAll()
    .executeTakeFirst();

  if (existingUser) {
    user = existingUser;
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
        })
        .returningAll()
        .executeTakeFirst();

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      user = newUser;
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ error: "Failed to create user" }, { status: 500 });
    }
  }

  const session = await lucia.createSession(user.id, {});

  return Response.json(
    {
      success: true,
      user,
      session,
    },
    {
      headers: {
        "Set-Cookie": lucia.createSessionCookie(session.id).serialize(),
      },
    }
  );
}

async function exchangeTokenForFid(token: string): Promise<string> {
  // TODO: Implement this
  return token;
}
