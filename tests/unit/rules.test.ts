import { describe, expect, it } from "vitest";
import {
  applicationDisplay,
  checkCanApply,
  checkCanDecide,
  formatStipend,
  matchScore,
  openingStatus,
  placementProgress,
  slotsLeft,
  type ApplicationLike,
} from "@/lib/rules";

const TODAY = "2026-10-02";
const opening = { id: 1, slots: 3, deadline: "2026-10-20", startDate: "2026-11-01", durationWeeks: 24 };
const student = { course: "Computer Science", city: "Uyo", requiredWeeks: 24 };

describe("openingStatus", () => {
  it("is open well before the deadline", () => {
    expect(openingStatus(opening, 0, TODAY)).toBe("open");
  });
  it("is closing soon within 7 days of the deadline", () => {
    expect(openingStatus({ ...opening, deadline: "2026-10-09" }, 0, TODAY)).toBe("closing_soon");
    expect(openingStatus({ ...opening, deadline: "2026-10-10" }, 0, TODAY)).toBe("open");
  });
  it("is still open on the deadline day", () => {
    expect(openingStatus({ ...opening, deadline: TODAY }, 0, TODAY)).toBe("closing_soon");
  });
  it("is full when every slot is taken", () => {
    expect(openingStatus(opening, 3, TODAY)).toBe("full");
  });
  it("is closed after the deadline even with slots left", () => {
    expect(openingStatus({ ...opening, deadline: "2026-10-01" }, 0, TODAY)).toBe("closed");
    expect(openingStatus({ ...opening, deadline: "2026-10-01" }, 3, TODAY)).toBe("closed");
  });
  it("never reports negative slots", () => {
    expect(slotsLeft(2, 5)).toBe(0);
  });
});

describe("checkCanApply", () => {
  const base = { opening, acceptedCount: 0, student, myApplications: [] as ApplicationLike[], today: TODAY };

  it("allows a normal application", () => {
    expect(checkCanApply(base)).toEqual({ ok: true });
  });
  it("blocks closed openings", () => {
    const r = checkCanApply({ ...base, opening: { ...opening, deadline: "2026-09-30" } });
    expect(r).toMatchObject({ ok: false, reason: expect.stringContaining("closed") });
  });
  it("blocks full openings", () => {
    expect(checkCanApply({ ...base, acceptedCount: 3 })).toMatchObject({ ok: false, reason: expect.stringContaining("filled") });
  });
  it("blocks a second application to the same opening", () => {
    const r = checkCanApply({ ...base, myApplications: [{ openingId: 1, status: "pending", appliedOn: TODAY }] });
    expect(r).toMatchObject({ ok: false, code: "already_applied" });
  });
  it("allows re-applying after withdrawing", () => {
    const r = checkCanApply({ ...base, myApplications: [{ openingId: 1, status: "withdrawn", appliedOn: TODAY }] });
    expect(r.ok).toBe(true);
  });
  it("blocks students who already have a placement", () => {
    const r = checkCanApply({ ...base, myApplications: [{ openingId: 9, status: "accepted", appliedOn: TODAY }] });
    expect(r).toMatchObject({ ok: false, reason: expect.stringContaining("accepted placement") });
  });
  it("caps pending applications at 3", () => {
    const pending: ApplicationLike[] = [7, 8, 9].map((id) => ({ openingId: id, status: "pending", appliedOn: TODAY }));
    expect(checkCanApply({ ...base, myApplications: pending })).toMatchObject({ ok: false, reason: expect.stringContaining("at most 3") });
    expect(checkCanApply({ ...base, myApplications: pending.slice(0, 2) }).ok).toBe(true);
  });
  it("blocks placements shorter than the SIWES length", () => {
    const r = checkCanApply({ ...base, opening: { ...opening, durationWeeks: 12 } });
    expect(r).toMatchObject({ ok: false, reason: expect.stringContaining("12 weeks") });
  });
  it("lets 12 week students take 24 week placements", () => {
    expect(checkCanApply({ ...base, student: { ...student, requiredWeeks: 12 } }).ok).toBe(true);
  });
});

describe("applicationDisplay", () => {
  it("flags pending applications older than 10 days", () => {
    expect(applicationDisplay({ status: "pending", appliedOn: "2026-09-22" }, TODAY)).toBe("pending");
    expect(applicationDisplay({ status: "pending", appliedOn: "2026-09-21" }, TODAY)).toBe("no_response");
  });
  it("leaves decided applications alone", () => {
    expect(applicationDisplay({ status: "accepted", appliedOn: "2026-01-01" }, TODAY)).toBe("accepted");
    expect(applicationDisplay({ status: "rejected", appliedOn: "2026-01-01" }, TODAY)).toBe("rejected");
  });
});


describe("checkCanDecide", () => {
  it("accepts while slots remain", () => {
    expect(checkCanDecide({ status: "pending", decision: "accepted", slots: 2, acceptedCount: 1 })).toEqual({ ok: true });
  });
  it("refuses to accept past capacity but still allows rejecting", () => {
    expect(checkCanDecide({ status: "pending", decision: "accepted", slots: 2, acceptedCount: 2 }).ok).toBe(false);
    expect(checkCanDecide({ status: "pending", decision: "rejected", slots: 2, acceptedCount: 2 }).ok).toBe(true);
  });
  it("refuses to decide twice", () => {
    expect(checkCanDecide({ status: "accepted", decision: "rejected", slots: 2, acceptedCount: 0 }).ok).toBe(false);
  });
});

describe("placementProgress", () => {
  it("counts down before the start", () => {
    expect(placementProgress("2026-10-12", 12, TODAY)).toMatchObject({ state: "not_started", daysToStart: 10, percent: 0, endDate: "2027-01-03" });
  });
  it("tracks the current week", () => {
    expect(placementProgress("2026-08-28", 12, TODAY)).toMatchObject({ state: "in_progress", currentWeek: 6, percent: 42 });
  });
  it("is week 1 on the first day", () => {
    expect(placementProgress(TODAY, 24, TODAY)).toMatchObject({ state: "in_progress", currentWeek: 1, percent: 0 });
  });
  it("completes after the last day", () => {
    expect(placementProgress("2026-01-01", 12, TODAY)).toMatchObject({ state: "completed", percent: 100 });
  });
});

describe("matchScore", () => {
  it("gives 100 for top track, same city and enough weeks", () => {
    expect(matchScore(student, { track: "software", city: "Uyo", durationWeeks: 24 }).score).toBe(100);
  });
  it("scores a secondary track lower", () => {
    expect(matchScore(student, { track: "uiux", city: "Uyo", durationWeeks: 24 }).score).toBe(85);
  });
  it("gives nothing for track or city when neither fits", () => {
    const r = matchScore(student, { track: "marketing", city: "Lagos", durationWeeks: 12 });
    expect(r.score).toBe(0);
    expect(r.reasons).toEqual([]);
  });
});

describe("formatStipend", () => {
  it("formats naira and unpaid roles", () => {
    expect(formatStipend(30000)).toBe("NGN 30,000 / month");
    expect(formatStipend(0)).toBe("Unpaid");
  });
});
