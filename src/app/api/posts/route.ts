import { withAuth } from "../../../lib/auth";
import { getUserDatasCached } from "../../../lib/farcaster";
import { postsForRendering } from "../../../lib/queries";

export const GET = withAuth(async (req, user, context) => {
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");

  if (!start || !end) {
    return Response.json({ error: "Missing start or end" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const posts = await postsForRendering
    .where("posts.userId", "=", user.id)
    .where("posts.createdAt", ">=", startDate)
    .where("posts.createdAt", "<=", endDate)
    .execute();

  const [userData] = await getUserDatasCached([user.fid]);

  // Group posts by date
  const groupedPosts = posts.reduce((acc, post) => {
    const date = post.createdAt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  return Response.json({ groupedPosts, users: { [user.fid]: userData } });
});
