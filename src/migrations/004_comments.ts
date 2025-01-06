import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("comments")
    .addColumn("id", "varchar", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("post_id", "varchar", (col) =>
      col.notNull().references("posts.id").onDelete("cascade")
    )
    .addColumn("user_id", "varchar", (col) =>
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Index for retrieving comments for a post
  await db.schema
    .createIndex("idx_comments_post")
    .on("comments")
    .columns(["post_id", "created_at desc", "deleted_at"])
    .where("deleted_at", "is", null)
    .execute();

  // Index for retrieving a user's comments
  await db.schema
    .createIndex("idx_comments_user")
    .on("comments")
    .columns(["user_id", "created_at desc", "deleted_at"])
    .where("deleted_at", "is", null)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_comments_post").execute();
  await db.schema.dropIndex("idx_comments_user").execute();
  await db.schema.dropTable("comments").execute();
}
