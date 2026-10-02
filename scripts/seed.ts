// Usage:
//   tsx scripts/seed.ts            wipe and reseed (local development)
//   tsx scripts/seed.ts --reset    same as above
//   tsx scripts/seed.ts --if-empty seed only when there are no users (production start)
import "dotenv/config";
import { createDb } from "../src/db";
import { clearAll, isEmpty, seed } from "../src/db/seed-data";
import { getToday } from "../src/lib/dates";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const { db, pool } = createDb(url);
  const today = getToday();
  try {
    if (process.argv.includes("--if-empty")) {
      if (!(await isEmpty(db))) {
        console.log("Database already has data, skipping seed");
        return;
      }
    } else {
      await clearAll(db);
    }
    const counts = await seed(db, today);
    console.log(`Seeded for ${today}:`, counts);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
