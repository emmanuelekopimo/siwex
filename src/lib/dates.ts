// All dates in the app are plain "YYYY-MM-DD" strings, compared in UTC so
// that results never depend on the server time zone.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtc(value: string): number {
  if (!isDateString(value)) throw new Error(`Invalid date: ${value}`);
  return Date.parse(`${value}T00:00:00Z`);
}

export function addDays(value: string, days: number): string {
  return new Date(toUtc(value) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/**
 * "Today" for the app. SIWEX_TODAY=YYYY-MM-DD pins it for demos and tests;
 * otherwise it is the current date in Lagos (WAT, UTC+1).
 */
export function getToday(env: Record<string, string | undefined> = process.env, now: Date = new Date()): string {
  const pinned = env.SIWEX_TODAY?.trim();
  if (pinned && isDateString(pinned)) return pinned;
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-02" -> "2 Oct 2026" */
export function formatDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Human phrase for a date relative to today: "today", "in 3 days", "5 days ago". */
export function relativeDays(value: string, today: string): string {
  const diff = daysBetween(today, value);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}
