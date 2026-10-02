import "dotenv/config";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { applications, hubs, openings, users } from "@/db/schema";
import { clearAll, DEMO_HUB_EMAIL, DEMO_PASSWORD, DEMO_STUDENT_EMAIL, seed } from "@/db/seed-data";
import * as data from "@/lib/data";

const TODAY = "2026-10-02";
const { db, pool } = createDb(process.env.TEST_DATABASE_URL!);

async function userId(email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email));
  return u.id;
}
async function openingId(title: string) {
  const [o] = await db.select().from(openings).where(eq(openings.title, title));
  return o.id;
}

beforeEach(async () => {
  await clearAll(db);
  await seed(db, TODAY);
});

afterAll(async () => {
  await pool.end();
});

describe("seed and directory", () => {
  it("seeds the four required Uyo hubs", async () => {
    const all = await data.searchHubs(db, {}, TODAY);
    const names = all.map((h) => h.name);
    for (const n of ["Futtybills", "Start Innovation Hub", "The RootHub", "Square One"]) expect(names).toContain(n);
  });

  it("filters hubs by city, track and keyword", async () => {
    expect((await data.searchHubs(db, { city: "Lagos" }, TODAY)).map((h) => h.name)).toEqual(["Co-Creation Hub"]);
    const design = await data.searchHubs(db, { track: "uiux" }, TODAY);
    expect(design.map((h) => h.name).sort()).toEqual(["Square One", "Start Innovation Hub"]);
    expect((await data.searchHubs(db, { q: "roothub" }, TODAY)).map((h) => h.name)).toEqual(["The RootHub"]);
  });

  it("counts open slots, ignoring full and closed openings", async () => {
    const [root] = await data.searchHubs(db, { q: "roothub" }, TODAY);
    // R1 has 3 slots open; R2 is full
    expect(root.openSlots).toBe(3);
    expect(root.openOpenings).toBe(1);
  });

  it("shows a mix of opening states on hub pages, live ones first", async () => {
    const start = await data.getHubBySlug(db, "start-innovation-hub", TODAY);
    expect(start!.openings.map((o) => o.status)).toEqual(["closing_soon", "open", "closed"]);
    const root = await data.getHubBySlug(db, "the-roothub", TODAY);
    expect(root!.openings.map((o) => o.status)).toContain("full");
  });
});

describe("auth", () => {
  it("verifies the demo logins", async () => {
    expect(await data.verifyLogin(db, DEMO_STUDENT_EMAIL, DEMO_PASSWORD)).toMatchObject({ role: "student", name: "Imaobong Udo" });
    expect(await data.verifyLogin(db, DEMO_HUB_EMAIL, DEMO_PASSWORD)).toMatchObject({ role: "hub" });
    expect(await data.verifyLogin(db, DEMO_STUDENT_EMAIL, "wrong")).toBeNull();
  });

  it("registers a student and refuses duplicate emails", async () => {
    const input = { name: "Edidiong Sam", email: "edidiong@example.com", password: "password1", school: "University of Uyo", course: "Statistics", level: 300, city: "Uyo", requiredWeeks: 24 };
    const r = await data.registerStudent(db, input);
    expect(r.ok).toBe(true);
    expect(await data.verifyLogin(db, input.email, input.password)).toMatchObject({ role: "student" });
    expect(await data.registerStudent(db, input)).toMatchObject({ ok: false });
  });

  it("registers a hub with its own profile", async () => {
    const r = await data.registerHub(db, { name: "Itoro Okon", email: "itoro@example.com", password: "password1", hubName: "Ikot Ekpene Tech Hub", city: "Ikot Ekpene", address: "Aba Road, Ikot Ekpene", about: "A small hub for young developers in Ikot Ekpene.", tracks: ["software"] });
    expect(r.ok).toBe(true);
    const hub = await data.getMyHub(db, r.ok ? r.value.userId : 0);
    expect(hub).toMatchObject({ slug: "ikot-ekpene-tech-hub", state: "Akwa Ibom" });
  });
});

describe("student flow", () => {
  it("lists the demo student's applications with a stale flag", async () => {
    const apps = await data.getMyApplications(db, await userId(DEMO_STUDENT_EMAIL), TODAY);
    expect(apps.map((a) => a.display).sort()).toEqual(["no_response", "pending", "rejected"]);
  });

  it("applies to an open opening and blocks a duplicate", async () => {
    const sid = await userId(DEMO_STUDENT_EMAIL);
    const oid = await openingId("Junior Software Engineer Intern");
    const note = "I build small React apps and want to work on payments.";
    expect(await data.applyToOpening(db, sid, { openingId: oid, note }, TODAY)).toMatchObject({ ok: true });
    expect(await data.applyToOpening(db, sid, { openingId: oid, note }, TODAY)).toMatchObject({ ok: false, reason: expect.stringContaining("already applied") });
  });

  it("enforces the 3 pending application cap", async () => {
    const sid = await userId(DEMO_STUDENT_EMAIL);
    const note = "I want hands-on experience in this role for my SIWES.";
    expect((await data.applyToOpening(db, sid, { openingId: await openingId("Junior Software Engineer Intern"), note }, TODAY)).ok).toBe(true);
    const r = await data.applyToOpening(db, sid, { openingId: await openingId("Data Analyst Intern"), note }, TODAY);
    expect(r).toMatchObject({ ok: false, reason: expect.stringContaining("at most 3") });
  });

  it("refuses closed openings and placements that are too short", async () => {
    const sid = await userId(DEMO_STUDENT_EMAIL);
    const note = "I want hands-on experience in this role for my SIWES.";
    expect(await data.applyToOpening(db, sid, { openingId: await openingId("IT Support and Networking Intern"), note }, TODAY)).toMatchObject({ ok: false, reason: expect.stringContaining("closed") });
    const rootFull = await openingId("Backend Developer Intern (Node.js)");
    expect(await data.applyToOpening(db, sid, { openingId: rootFull, note }, TODAY)).toMatchObject({ ok: false, reason: expect.stringContaining("filled") });
  });

  it("only withdraws the student's own pending applications", async () => {
    const sid = await userId(DEMO_STUDENT_EMAIL);
    const other = await userId("ekemini@siwex.ng");
    const [mine] = await db.select().from(applications).where(eq(applications.studentUserId, sid));
    expect(await data.withdrawApplication(db, other, mine.id, TODAY)).toMatchObject({ ok: false });
    const pending = (await db.select().from(applications).where(eq(applications.studentUserId, sid))).find((a) => a.status === "pending")!;
    expect(await data.withdrawApplication(db, sid, pending.id, TODAY)).toMatchObject({ ok: true });
  });

  it("recommends open roles the student has not applied to, best match first", async () => {
    const recs = await data.getRecommendations(db, await userId(DEMO_STUDENT_EMAIL), TODAY);
    expect(recs[0].opening.title).toBe("Junior Software Engineer Intern");
    expect(recs[0].match.score).toBe(100);
    expect(recs.every((r) => r.opening.status === "open" || r.opening.status === "closing_soon")).toBe(true);
    expect(recs.map((r) => r.opening.title)).not.toContain("Frontend Developer Intern (React)");
  });
});

describe("hub flow", () => {
  it("builds the demo hub dashboard", async () => {
    const dash = await data.getHubDashboard(db, await userId(DEMO_HUB_EMAIL), TODAY);
    expect(dash!.stats).toEqual({ liveOpenings: 2, pending: 4, needsResponse: 1, interns: 2 });
    expect(dash!.interns.every((i) => i.progress?.state === "in_progress")).toBe(true);
  });

  it("accepts an application, then the student sees the placement", async () => {
    const hubUser = await userId(DEMO_HUB_EMAIL);
    const sid = await userId(DEMO_STUDENT_EMAIL);
    const dash = await data.getHubDashboard(db, hubUser, TODAY);
    const app = dash!.pending.find((p) => p.user.email === DEMO_STUDENT_EMAIL)!;
    expect(await data.decideApplication(db, hubUser, app.application.id, "accepted", TODAY)).toMatchObject({ ok: true });
    const apps = await data.getMyApplications(db, sid, TODAY);
    const placed = apps.find((a) => a.application.status === "accepted")!;
    expect(placed.progress).toMatchObject({ state: "not_started", daysToStart: 30 });
    // and now the student cannot apply anywhere else
    expect(await data.canStudentApply(db, sid, await openingId("Junior Software Engineer Intern"), TODAY)).toMatchObject({ ok: false, reason: expect.stringContaining("accepted placement") });
  });

  it("cannot decide applications that belong to another hub", async () => {
    const otherHub = await userId("roothub@siwex.ng");
    const dash = await data.getHubDashboard(db, await userId(DEMO_HUB_EMAIL), TODAY);
    const r = await data.decideApplication(db, otherHub, dash!.pending[0].application.id, "accepted", TODAY);
    expect(r).toMatchObject({ ok: false, reason: "Application not found." });
  });

  it("will not accept beyond the number of slots", async () => {
    const hubUser = await userId(DEMO_HUB_EMAIL);
    const [s2] = await db.select().from(openings).where(eq(openings.title, "UI/UX Design Intern"));
    await db.update(openings).set({ slots: 0 }).where(eq(openings.id, s2.id));
    const dash = await data.getHubDashboard(db, hubUser, TODAY);
    const app = dash!.pending.find((p) => p.opening.id === s2.id)!;
    expect(await data.decideApplication(db, hubUser, app.application.id, "accepted", TODAY)).toMatchObject({ ok: false, reason: expect.stringContaining("No slots left") });
  });

  it("creates openings only for the signed-in hub", async () => {
    const hubUser = await userId(DEMO_HUB_EMAIL);
    const input = { title: "Mobile Developer Intern", track: "software", description: "Build Flutter screens with the mobile team.", slots: 2, durationWeeks: 24, startDate: "2026-11-15", deadline: "2026-10-25", stipendNaira: 25000 };
    const r = await data.createOpening(db, hubUser, input, TODAY);
    expect(r.ok).toBe(true);
    const [row] = await db.select({ hubSlug: hubs.slug }).from(openings).innerJoin(hubs, eq(hubs.id, openings.hubId)).where(eq(openings.title, input.title));
    expect(row.hubSlug).toBe("start-innovation-hub");
    expect(await data.createOpening(db, await userId(DEMO_STUDENT_EMAIL), input, TODAY)).toMatchObject({ ok: false });
  });
});
