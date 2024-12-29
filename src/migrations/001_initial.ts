import { Kysely, sql } from "kysely";
import { ANCHOR_TIMEZONES } from "../lib/constants";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "varchar", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("fid", "integer", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("timezone", "varchar")
    .addColumn("notification_url", "varchar")
    .addColumn("notification_token", "varchar")
    .execute();

  await db.schema
    .createTable("user_session")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) =>
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("post_alerts")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn("time_utc", "timestamptz", (col) => col.notNull())
    .addColumn("timezone", "text", (col) => col.notNull())
    .addUniqueConstraint("unique_timezone_time_utc", ["timezone", "time_utc"])
    .execute();

  await db.schema
    .createTable("posts")
    .addColumn("id", "varchar", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("user_id", "varchar", (col) =>
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("post_alert_id", "integer", (col) =>
      col.notNull().references("post_alerts.id").onDelete("cascade")
    )
    .addColumn("front_image_url", "varchar")
    .addColumn("back_image_url", "varchar")
    .addColumn("primary_image", "varchar")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  await db.schema
    .createIndex("idx_users_fid")
    .on("users")
    .column("fid")
    .execute();

  await db.schema
    .createIndex("idx_users_timezone")
    .on("users")
    .column("timezone")
    .execute();

  await db.schema
    .createIndex("idx_users_notification")
    .on("users")
    .columns(["notification_url", "notification_token"])
    .where("notification_url", "is not", null)
    .where("notification_token", "is not", null)
    .execute();

  await db.schema
    .createIndex("idx_posts_feed")
    .on("posts")
    .columns(["created_at desc", "deleted_at"])
    .where("deleted_at", "is", null)
    .execute();

  await db.schema
    .createIndex("idx_posts_user_alert")
    .on("posts")
    .columns(["user_id", "post_alert_id", "deleted_at"])
    .where("deleted_at", "is", null)
    .execute();

  await db.schema
    .createIndex("idx_post_alerts_timezone_time")
    .on("post_alerts")
    .columns(["timezone", "time_utc desc"])
    .execute();

  await db.schema
    .createIndex("idx_user_session_user")
    .on("user_session")
    .column("user_id")
    .execute();

  await db
    .insertInto("post_alerts")
    .values(
      ANCHOR_TIMEZONES.map((tz) => ({
        timezone: tz,
        time_utc: new Date(),
      }))
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_users_fid").execute();
  await db.schema.dropIndex("idx_users_timezone").execute();
  await db.schema.dropIndex("idx_users_notification").execute();
  await db.schema.dropIndex("idx_posts_feed").execute();
  await db.schema.dropIndex("idx_posts_user_alert").execute();
  await db.schema.dropIndex("idx_posts_cleanup").execute();
  await db.schema.dropIndex("idx_post_alerts_timezone_time").execute();
  await db.schema.dropIndex("idx_user_session_user").execute();

  await db.schema.dropTable("posts").execute();
  await db.schema.dropTable("post_alerts").execute();
  await db.schema.dropTable("user_session").execute();
  await db.schema.dropTable("users").execute();
}
