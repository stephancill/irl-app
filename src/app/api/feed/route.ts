import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMutuals, getUserDatasCached } from "@/lib/farcaster";
import { getMutualsKey } from "@/lib/keys";
import { latestPostAlert, postsForRendering } from "@/lib/queries";
import { withCache } from "@/lib/redis";

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 5;

  const mutuals = await withCache(getMutualsKey(user.fid), () =>
    getMutuals(user.fid)
  );

  // Filter out mutuals that are not in db
  // TODO: When users >> we need to find a better way to do this
  const allUserFids = await db.selectFrom("users").select(["fid"]).execute();
  const allUserFidsSet = new Set(allUserFids.map((u) => u.fid));

  const feedFids = [
    ...mutuals.filter((m) => allUserFidsSet.has(m.fid)).map((m) => m.fid),
    user.fid,
  ];
  const userDatas = await getUserDatasCached(feedFids);

  const farcasterUsersByFid = userDatas.reduce((acc, m) => {
    acc[m.fid] = m;
    return acc;
  }, {} as Record<number, (typeof userDatas)[number]>);

  // TODO: Only show posts from users that the user follows
  let query = postsForRendering
    .where("posts.createdAt", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000))
    .where("posts.deletedAt", "is", null)
    .where("posts.frontImageUrl", "is not", null)
    .where("posts.backImageUrl", "is not", null)
    .where("users.fid", "in", feedFids)
    .orderBy("posts.createdAt", "desc")
    .limit(limit + 1);

  if (cursor) {
    query = query.where("posts.createdAt", "<", new Date(cursor));
  }

  let posts = await query.execute();

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

  const users = posts.reduce((acc, post) => {
    acc[post.fid] = farcasterUsersByFid[post.fid];
    return acc;
  }, {} as typeof farcasterUsersByFid);

  // Check if there are more posts
  const hasMore = posts.length > limit;
  const nextPosts = hasMore ? posts.slice(0, -1) : posts;

  return Response.json({
    posts: nextPosts,
    users,
    nextCursor: hasMore
      ? posts[posts.length - 2].createdAt.toISOString()
      : null,
  });
});
