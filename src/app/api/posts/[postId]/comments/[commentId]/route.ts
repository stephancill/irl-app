import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const DELETE = withAuth<{ params: Promise<{ commentId: string }> }>(
  async (req, user, context) => {
    const { commentId } = await context.params;
    const deleted = await db
      .deleteFrom("comments")
      .where("id", "=", commentId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!deleted) {
      return Response.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  }
);
