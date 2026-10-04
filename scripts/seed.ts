// Usage:
//   tsx scripts/seed.ts            wipe and reseed (local development)
//   tsx scripts/seed.ts --reset    same as above
//   tsx scripts/seed.ts --if-empty seed only when there are no users
//   tsx scripts/seed.ts --if-stale seed when empty or when SEED_VERSION changed (production start)
import "dotenv/config";
import { createDb } from "../src/db";
import { clearAll, isEmpty, seed, SEED_VERSION, storedSeedVersion } from "../src/db/seed-data";
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
    } else if (process.argv.includes("--if-stale")) {
      const stored = await storedSeedVersion(db);
      if (!(await isEmpty(db)) && stored === SEED_VERSION) {
        console.log(`Demo data is at seed version ${SEED_VERSION}, skipping seed`);
        return;
      }
      console.log(`Reseeding demo data (stored version ${stored ?? "none"}, code version ${SEED_VERSION})`);
      await clearAll(db);
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
