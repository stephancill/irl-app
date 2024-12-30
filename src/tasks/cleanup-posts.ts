import { db } from "../lib/db";

/**
 * Deletes posts older than 2 minutes that have no front or back image
 */
export async function cleanupPosts() {
  await db
    .deleteFrom("posts")
    .where("createdAt", "<", new Date(Date.now() - 2 * 60 * 1000))
    .where((eb) =>
      eb.or([eb("frontImageUrl", "is", null), eb("backImageUrl", "is", null)])
    )
    .execute();
}

if (require.main === module) {
  cleanupPosts()
    .then(() => console.log("Posts cleaned up successfully"))
    .catch((error) => console.error("Error cleaning up posts:", error))
    .finally(() => process.exit(0));
}
