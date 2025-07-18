import { User } from "lucia";
import { db } from "./db";
import { latestPostAlert, postsForRendering } from "./queries";

/**
 * Determines how many posts a user has remaining. Rules:
 * - If the user posted in time, they can post up to 2 more times
 * - If the user has not posted in time, they can only post once
 */
export async function postsAllowanceDetails(
  userId: string,
  latestAlertId: number | null,
  latestAlertExpiry: Date | null
): Promise<{ postsRemaining: number; postsToday: number }> {
  // If there's no alert, user can always post
  if (!latestAlertId || !latestAlertExpiry) {
    return { postsRemaining: 1, postsToday: 0 };
  }

  const latestAlertPosts = await db
    .selectFrom("posts")
    .selectAll()
    .where("postAlertId", "=", latestAlertId)
    .where("deletedAt", "is", null)
    .where("userId", "=", userId)
    .orderBy("createdAt", "asc")
    .execute();

  // If no posts yet, user can post
  if (latestAlertPosts.length === 0) {
    return { postsRemaining: 1, postsToday: 0 };
  }

  const firstPostInTime =
    latestAlertPosts[0].createdAt.getTime() < latestAlertExpiry.getTime();

  // If user posted in time, they can post up to 3 times total
  // If user didn't post in time, they can post once
  return firstPostInTime
    ? {
        postsRemaining: 3 - latestAlertPosts.length,
        postsToday: latestAlertPosts.length,
      }
    : { postsRemaining: 0, postsToday: latestAlertPosts.length };
}

export async function processPostsVisibility(
  posts: Awaited<ReturnType<typeof postsForRendering.execute>>,
  user: User
) {
  if (!user.timezone) {
    throw new Error("User has no timezone");
  }

  // Replace image urls with placeholder if user hasn't posted today
  const latestAlert = await latestPostAlert
    .where("timezone", "=", user.timezone)
    .executeTakeFirst();

  if (!latestAlert) {
    throw new Error("User has no latest alert");
  }

  const userPostsToday = await db
    .selectFrom("posts")
    .selectAll()
    .where("userId", "=", user.id)
    .where("postAlertId", "=", latestAlert.id)
    .where("deletedAt", "is", null)
    .execute();

  const canViewPosts = userPostsToday.length > 0;

  if (!canViewPosts) {
    posts = posts.map((post) => ({
      ...post,
      frontImageUrl: null,
      backImageUrl: null,
    }));
  }

  return posts;
}
