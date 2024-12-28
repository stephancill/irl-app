import { lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserData } from "@/lib/farcaster";
import { postsAllowanceDetails } from "@/lib/posts";
import { determineTimezone, parseGeo } from "@/lib/utils";
import { User } from "@/types/user";
import { UserDataType } from "@farcaster/core";
import { sql } from "kysely";
import { NextRequest } from "next/server";

const selectUserWithAlert = db
  .selectFrom("users")
  .leftJoin(
    db
      .selectFrom("postAlerts")
      .select(["id", "timeUtc", "timezone"])
      .orderBy("timeUtc", "desc")
      .$call((qb) => qb.limit(1))
      .as("latestAlert"),
    (join) => join.onRef("latestAlert.timezone", "=", "users.timezone")
  )
  .select([
    "users.id",
    "users.fid",
    "users.timezone",
    "users.notificationUrl",
    "users.notificationToken",
    "users.createdAt",
    "users.updatedAt",
    "latestAlert.timeUtc as latestAlertTime",
    sql<Date>`latest_alert.time_utc + INTERVAL '5 MINUTES'`.as(
      "latestAlertExpiry"
    ),
    "latestAlert.id as latestAlertId",
  ]);

export async function GET(req: NextRequest) {
  // TODO: Frames v2 tokens not yet implemented, so will just be the fid
  const token = lucia.readBearerToken(req.headers.get("Authorization") ?? "");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Exchange token for fid
  const fid = await exchangeTokenForFid(token);

  let dbUser: Omit<User, "postsRemaining" | "postsToday"> | undefined;

  // Check if the fid is already registered
  const existingUser = await selectUserWithAlert
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
        dbUser = await selectUserWithAlert
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
        })
        .returningAll()
        .executeTakeFirst();

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      // Get the user with the alert after creation
      dbUser = await selectUserWithAlert
        .where("users.id", "=", newUser.id)
        .executeTakeFirst();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ error: "Failed to create user" }, { status: 500 });
    }
  }

  if (!dbUser) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  const allowanceDetails = await postsAllowanceDetails(
    dbUser!.id,
    dbUser!.latestAlertId,
    dbUser!.latestAlertExpiry
  );

  const user: User = {
    ...dbUser,
    ...allowanceDetails,
  };

  const session = await lucia.createSession(dbUser!.id, {});

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
