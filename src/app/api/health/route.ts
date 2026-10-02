import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", database: "ok", today: getToday() });
  } catch (err) {
    return Response.json({ status: "error", database: "unreachable", error: (err as Error).message }, { status: 503 });
  }
}
