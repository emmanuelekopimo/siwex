import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Page } from "@playwright/test";
import { createDb } from "../src/db";
import { clearAll, seed } from "../src/db/seed-data";

export const TODAY = "2026-10-02";

/** Reset the test database to the demo seed so every test starts the same. */
export async function reseed() {
  const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);
  await migrate(db, { migrationsFolder: "drizzle" });
  await clearAll(db);
  await seed(db, TODAY);
  await pool.end();
}

export async function signIn(page: Page, as: "student" | "hub") {
  await page.goto(as === "hub" ? "/sign-in?demo=hub" : "/sign-in");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(as === "hub" ? "**/hub" : "**/student");
}
