// Data access. Every function takes the db so integration tests can point it
// at the test database, and every user-specific query is scoped by userId.

import bcrypt from "bcryptjs";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { applications, hubs, openings, students, users, type Hub, type Opening } from "@/db/schema";
import {
  applicationDisplay,
  checkCanApply,
  checkCanDecide,
  matchScore,
  openingStatus,
  placementProgress,
  slotsLeft,
  type ApplyCheck,
} from "./rules";
import type { SessionPayload } from "./session";

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; reason: string };

/* ---------- accepted counts ---------- */

async function acceptedCounts(db: DB, openingIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (openingIds.length === 0) return map;
  const rows = await db
    .select({ openingId: applications.openingId, n: sql<number>`count(*)::int` })
    .from(applications)
    .where(and(inArray(applications.openingId, openingIds), eq(applications.status, "accepted")))
    .groupBy(applications.openingId);
  for (const r of rows) map.set(r.openingId, r.n);
  return map;
}

export interface OpeningView extends Opening {
  accepted: number;
  slotsLeft: number;
  status: ReturnType<typeof openingStatus>;
}

function toOpeningView(o: Opening, accepted: number, today: string): OpeningView {
  return { ...o, accepted, slotsLeft: slotsLeft(o.slots, accepted), status: openingStatus(o, accepted, today) };
}

const STATUS_ORDER = { closing_soon: 0, open: 1, full: 2, closed: 3 } as const;

/** Live openings first (closing soon at the top), then full, then closed. */
export function sortOpenings<T extends { status: OpeningView["status"]; deadline: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.deadline.localeCompare(b.deadline));
}

/* ---------- public hub directory ---------- */

export interface HubCard extends Hub {
  openSlots: number;
  openOpenings: number;
}

export async function searchHubs(
  db: DB,
  filters: { q?: string; city?: string; track?: string },
  today: string,
): Promise<HubCard[]> {
  const conds = [];
  if (filters.q) {
    const like = `%${filters.q}%`;
    conds.push(or(ilike(hubs.name, like), ilike(hubs.about, like), ilike(hubs.address, like)));
  }
  if (filters.city) conds.push(eq(hubs.city, filters.city));
  if (filters.track) conds.push(sql`${filters.track} = any(${hubs.tracks})`);
  const hubRows = await db
    .select()
    .from(hubs)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(hubs.name));
  if (hubRows.length === 0) return [];

  const openRows = await db.select().from(openings).where(inArray(openings.hubId, hubRows.map((h) => h.id)));
  const counts = await acceptedCounts(db, openRows.map((o) => o.id));
  return hubRows.map((h) => {
    const mine = openRows
      .filter((o) => o.hubId === h.id)
      .map((o) => toOpeningView(o, counts.get(o.id) ?? 0, today))
      .filter((o) => o.status === "open" || o.status === "closing_soon");
    return { ...h, openOpenings: mine.length, openSlots: mine.reduce((s, o) => s + o.slotsLeft, 0) };
  });
}

export async function getHubBySlug(db: DB, slug: string, today: string) {
  const [hub] = await db.select().from(hubs).where(eq(hubs.slug, slug));
  if (!hub) return null;
  const rows = await db.select().from(openings).where(eq(openings.hubId, hub.id)).orderBy(asc(openings.deadline));
  const counts = await acceptedCounts(db, rows.map((o) => o.id));
  return { hub, openings: sortOpenings(rows.map((o) => toOpeningView(o, counts.get(o.id) ?? 0, today))) };
}

export async function platformStats(db: DB, today: string) {
  const [h] = await db.select({ n: sql<number>`count(*)::int` }).from(hubs);
  const rows = await db.select().from(openings);
  const counts = await acceptedCounts(db, rows.map((o) => o.id));
  const views = rows.map((o) => toOpeningView(o, counts.get(o.id) ?? 0, today));
  const openSlots = views
    .filter((o) => o.status === "open" || o.status === "closing_soon")
    .reduce((s, o) => s + o.slotsLeft, 0);
  const placed = [...counts.values()].reduce((s, n) => s + n, 0);
  return { hubs: h.n, openSlots, placed };
}

/* ---------- auth ---------- */

export async function verifyLogin(db: DB, email: string, password: string): Promise<SessionPayload | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { userId: user.id, role: user.role, name: user.name } : null;
}

async function emailTaken(db: DB, email: string) {
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  return Boolean(u);
}

export async function registerStudent(
  db: DB,
  input: { name: string; email: string; password: string; school: string; course: string; level: number; city: string; requiredWeeks: number },
): Promise<Result<SessionPayload>> {
  if (await emailTaken(db, input.email)) return { ok: false, reason: "An account with this email already exists" };
  const passwordHash = await bcrypt.hash(input.password, 10);
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: input.email, name: input.name, passwordHash, role: "student" })
      .returning();
    await tx.insert(students).values({
      userId: user.id,
      school: input.school,
      course: input.course,
      level: input.level,
      city: input.city,
      requiredWeeks: input.requiredWeeks,
    });
    return { ok: true as const, value: { userId: user.id, role: "student" as const, name: user.name } };
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function registerHub(
  db: DB,
  input: { name: string; email: string; password: string; hubName: string; city: string; address: string; about: string; tracks: string[] },
): Promise<Result<SessionPayload>> {
  if (await emailTaken(db, input.email)) return { ok: false, reason: "An account with this email already exists" };
  const passwordHash = await bcrypt.hash(input.password, 10);
  let slug = slugify(input.hubName) || "hub";
  const [clash] = await db.select({ id: hubs.id }).from(hubs).where(eq(hubs.slug, slug));
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: input.email, name: input.name, passwordHash, role: "hub" })
      .returning();
    await tx.insert(hubs).values({
      ownerUserId: user.id,
      slug,
      name: input.hubName,
      city: input.city,
      state: input.city === "Uyo" || input.city === "Eket" || input.city === "Ikot Ekpene" ? "Akwa Ibom" : input.city,
      address: input.address,
      about: input.about,
      tracks: input.tracks,
    });
    return { ok: true as const, value: { userId: user.id, role: "hub" as const, name: user.name } };
  });
}

/* ---------- student side ---------- */

export async function getStudentProfile(db: DB, userId: number) {
  const [row] = await db
    .select({ user: users, student: students })
    .from(users)
    .innerJoin(students, eq(students.userId, users.id))
    .where(eq(users.id, userId));
  return row ?? null;
}

export async function getMyApplications(db: DB, studentUserId: number, today: string) {
  const rows = await db
    .select({ application: applications, opening: openings, hub: hubs })
    .from(applications)
    .innerJoin(openings, eq(openings.id, applications.openingId))
    .innerJoin(hubs, eq(hubs.id, openings.hubId))
    .where(eq(applications.studentUserId, studentUserId))
    .orderBy(desc(applications.appliedOn), desc(applications.id));
  return rows.map((r) => ({
    ...r,
    display: applicationDisplay(r.application, today),
    progress: r.application.status === "accepted" ? placementProgress(r.opening.startDate, r.opening.durationWeeks, today) : null,
  }));
}

/** Open openings ranked by match score for this student. */
export async function getRecommendations(db: DB, studentUserId: number, today: string, limit = 4) {
  const profile = await getStudentProfile(db, studentUserId);
  if (!profile) return [];
  const rows = await db.select({ opening: openings, hub: hubs }).from(openings).innerJoin(hubs, eq(hubs.id, openings.hubId));
  const counts = await acceptedCounts(db, rows.map((r) => r.opening.id));
  const mine = await db
    .select({ openingId: applications.openingId })
    .from(applications)
    .where(eq(applications.studentUserId, studentUserId));
  const applied = new Set(mine.map((m) => m.openingId));
  return rows
    .map((r) => ({
      hub: r.hub,
      opening: toOpeningView(r.opening, counts.get(r.opening.id) ?? 0, today),
      match: matchScore(profile.student, { ...r.opening, city: r.hub.city }),
    }))
    .filter((r) => (r.opening.status === "open" || r.opening.status === "closing_soon") && !applied.has(r.opening.id))
    .sort((a, b) => b.match.score - a.match.score || a.opening.deadline.localeCompare(b.opening.deadline))
    .slice(0, limit);
}

async function applyContext(db: DB, studentUserId: number, openingId: number) {
  const profile = await getStudentProfile(db, studentUserId);
  const [opening] = await db.select().from(openings).where(eq(openings.id, openingId));
  if (!profile || !opening) return null;
  const counts = await acceptedCounts(db, [openingId]);
  const myApplications = await db
    .select({ openingId: applications.openingId, status: applications.status, appliedOn: applications.appliedOn })
    .from(applications)
    .where(eq(applications.studentUserId, studentUserId));
  return { profile, opening, acceptedCount: counts.get(openingId) ?? 0, myApplications };
}

export async function canStudentApply(db: DB, studentUserId: number, openingId: number, today: string): Promise<ApplyCheck> {
  const ctx = await applyContext(db, studentUserId, openingId);
  if (!ctx) return { ok: false, reason: "Opening not found." };
  return checkCanApply({ opening: ctx.opening, acceptedCount: ctx.acceptedCount, student: ctx.profile.student, myApplications: ctx.myApplications, today });
}

export async function applyToOpening(
  db: DB,
  studentUserId: number,
  input: { openingId: number; note: string },
  today: string,
): Promise<Result<number>> {
  const ctx = await applyContext(db, studentUserId, input.openingId);
  if (!ctx) return { ok: false, reason: "Opening not found." };
  const check = checkCanApply({ opening: ctx.opening, acceptedCount: ctx.acceptedCount, student: ctx.profile.student, myApplications: ctx.myApplications, today });
  if (!check.ok) return check;
  // A withdrawn application to the same opening is reused so the unique index holds.
  const [row] = await db
    .insert(applications)
    .values({ openingId: input.openingId, studentUserId, note: input.note, appliedOn: today, status: "pending" })
    .onConflictDoUpdate({
      target: [applications.openingId, applications.studentUserId],
      set: { note: input.note, appliedOn: today, status: "pending", decidedOn: null },
    })
    .returning({ id: applications.id });
  return { ok: true, value: row.id };
}

export async function withdrawApplication(db: DB, studentUserId: number, applicationId: number, today: string): Promise<Result> {
  const updated = await db
    .update(applications)
    .set({ status: "withdrawn", decidedOn: today })
    .where(and(eq(applications.id, applicationId), eq(applications.studentUserId, studentUserId), eq(applications.status, "pending")))
    .returning({ id: applications.id });
  return updated.length ? { ok: true, value: undefined } : { ok: false, reason: "Only your pending applications can be withdrawn." };
}

/* ---------- hub side ---------- */

export async function getMyHub(db: DB, ownerUserId: number) {
  const [hub] = await db.select().from(hubs).where(eq(hubs.ownerUserId, ownerUserId));
  return hub ?? null;
}

export async function getHubDashboard(db: DB, ownerUserId: number, today: string) {
  const hub = await getMyHub(db, ownerUserId);
  if (!hub) return null;
  const openRows = await db.select().from(openings).where(eq(openings.hubId, hub.id)).orderBy(asc(openings.deadline));
  const counts = await acceptedCounts(db, openRows.map((o) => o.id));
  const openingViews = sortOpenings(openRows.map((o) => toOpeningView(o, counts.get(o.id) ?? 0, today)));
  const appRows = openRows.length
    ? await db
        .select({ application: applications, user: users, student: students })
        .from(applications)
        .innerJoin(users, eq(users.id, applications.studentUserId))
        .innerJoin(students, eq(students.userId, users.id))
        .where(inArray(applications.openingId, openRows.map((o) => o.id)))
        .orderBy(asc(applications.appliedOn), asc(applications.id))
    : [];
  const byId = new Map(openingViews.map((o) => [o.id, o]));
  const apps = appRows.map((r) => {
    const opening = byId.get(r.application.openingId)!;
    return {
      ...r,
      opening,
      display: applicationDisplay(r.application, today),
      match: matchScore(r.student, { ...opening, city: hub.city }),
      progress: r.application.status === "accepted" ? placementProgress(opening.startDate, opening.durationWeeks, today) : null,
    };
  });
  const pending = apps.filter((a) => a.application.status === "pending");
  return {
    hub,
    openings: openingViews,
    pending,
    interns: apps.filter((a) => a.application.status === "accepted"),
    stats: {
      liveOpenings: openingViews.filter((o) => o.status === "open" || o.status === "closing_soon").length,
      pending: pending.length,
      needsResponse: pending.filter((a) => a.display === "no_response").length,
      interns: apps.filter((a) => a.application.status === "accepted").length,
    },
  };
}

export async function decideApplication(
  db: DB,
  ownerUserId: number,
  applicationId: number,
  decision: "accepted" | "rejected",
  today: string,
): Promise<Result> {
  const [row] = await db
    .select({ application: applications, opening: openings })
    .from(applications)
    .innerJoin(openings, eq(openings.id, applications.openingId))
    .innerJoin(hubs, eq(hubs.id, openings.hubId))
    .where(and(eq(applications.id, applicationId), eq(hubs.ownerUserId, ownerUserId)));
  if (!row) return { ok: false, reason: "Application not found." };
  const counts = await acceptedCounts(db, [row.opening.id]);
  const check = checkCanDecide({
    status: row.application.status,
    decision,
    slots: row.opening.slots,
    acceptedCount: counts.get(row.opening.id) ?? 0,
  });
  if (!check.ok) return check;
  await db.update(applications).set({ status: decision, decidedOn: today }).where(eq(applications.id, applicationId));
  return { ok: true, value: undefined };
}

export async function createOpening(
  db: DB,
  ownerUserId: number,
  input: Omit<Opening, "id" | "hubId" | "createdAt">,
  today: string,
): Promise<Result<number>> {
  const hub = await getMyHub(db, ownerUserId);
  if (!hub) return { ok: false, reason: "No hub profile found for this account." };
  if (input.deadline < today) return { ok: false, reason: "Deadline cannot be in the past." };
  const [row] = await db.insert(openings).values({ ...input, hubId: hub.id }).returning({ id: openings.id });
  return { ok: true, value: row.id };
}
