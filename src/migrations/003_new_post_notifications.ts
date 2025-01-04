import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("new_post_notifications", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .execute();

  await db.schema
    .createIndex("idx_users_new_post_notifications")
    .on("users")
    .column("new_post_notifications")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_users_new_post_notifications").execute();
  await db.schema
    .alterTable("users")
    .dropColumn("new_post_notifications")
    .execute();
}
