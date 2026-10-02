import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "../src/db";

// Integration tests run against a real Postgres test database.
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  const { db, pool } = createDb(url);
  await migrate(db, { migrationsFolder: "drizzle" });
  await pool.end();
}
