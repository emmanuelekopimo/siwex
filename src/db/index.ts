import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { siwexPool?: Pool };

export function createDb(url: string): { db: DB; pool: Pool } {
  const pool = new Pool({ connectionString: url, max: 5 });
  return { db: drizzle(pool, { schema }), pool };
}

function getPool(): Pool {
  if (!globalForDb.siwexPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.siwexPool = new Pool({ connectionString: url, max: 5 });
  }
  return globalForDb.siwexPool;
}

let cached: DB | undefined;

export function getDb(): DB {
  if (!cached) cached = drizzle(getPool(), { schema });
  return cached;
}

export { schema };
