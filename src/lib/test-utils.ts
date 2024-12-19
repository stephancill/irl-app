import { Kysely, sql } from "kysely";
import { Tables } from "../types/db";
import { getDbClient, migrateToLatest } from "./db";

const POSTGRES_URL = "postgres://postgres:password@localhost:5432";

if (process.env["NODE_ENV"] !== "test") {
  throw new Error("NODE_ENV must be set to test");
}

export type TestDb = {
  db: Kysely<Tables>;
  destroy(): Promise<void>;
};

export async function createTestDatabase(): Promise<TestDb> {
  const databaseName = `test_db_${Math.random().toString(36).substring(7)}`;
  const db = getDbClient(POSTGRES_URL);

  await sql`DROP DATABASE IF EXISTS ${sql.ref(databaseName)}`.execute(db);
  await sql`CREATE DATABASE ${sql.ref(databaseName)}`.execute(db);

  const testDb = getDbClient(`${POSTGRES_URL}/${databaseName}`);
  await migrateToLatest(testDb);

  return {
    db: testDb,
    async destroy() {
      await testDb.destroy();
      await sql`DROP DATABASE IF EXISTS ${sql.ref(databaseName)}`.execute(db);
      await db.destroy();
    },
  };
}
