// Business rules for SIWEX. Everything here is pure: no database, no clock.
// Callers pass "today" as a YYYY-MM-DD string (see getToday in dates.ts).

import { COURSE_TRACKS } from "./catalog";
import { addDays, daysBetween } from "./dates";

export const CLOSING_SOON_DAYS = 7;
export const STALE_PENDING_DAYS = 10;
export const MAX_PENDING_APPLICATIONS = 3;

export type OpeningStatus = "open" | "closing_soon" | "full" | "closed";

export interface OpeningLike {
  slots: number;
  deadline: string;
  startDate: string;
  durationWeeks: number;
}

export function slotsLeft(slots: number, acceptedCount: number): number {
  return Math.max(0, slots - acceptedCount);
}

/**
 * Status of an opening on a given day.
 * Closed beats full: once the deadline passes it no longer matters how many
 * slots are left.
 */
export function openingStatus(opening: Pick<OpeningLike, "slots" | "deadline">, acceptedCount: number, today: string): OpeningStatus {
  const daysLeft = daysBetween(today, opening.deadline);
  if (daysLeft < 0) return "closed";
  if (slotsLeft(opening.slots, acceptedCount) === 0) return "full";
  if (daysLeft <= CLOSING_SOON_DAYS) return "closing_soon";
  return "open";
}

export const OPENING_STATUS_LABEL: Record<OpeningStatus, string> = {
  open: "Open",
  closing_soon: "Closing soon",
  full: "Full",
  closed: "Closed",
};

export interface ApplicationLike {
  openingId: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  appliedOn: string;
}

export interface StudentLike {
  course: string;
  city: string;
  requiredWeeks: number;
}

export type ApplyCheck = { ok: true } | { ok: false; reason: string; code?: "already_applied" };

/** Can this student apply to this opening today? Returns the first blocking reason. */
export function checkCanApply(args: {
  opening: OpeningLike & { id: number };
  acceptedCount: number;
  student: StudentLike;
  myApplications: ApplicationLike[];
  today: string;
}): ApplyCheck {
  const { opening, acceptedCount, student, myApplications, today } = args;
  const status = openingStatus(opening, acceptedCount, today);
  if (status === "closed") return { ok: false, reason: "Applications for this opening have closed." };
  if (status === "full") return { ok: false, reason: "All slots for this opening have been filled." };

  const existing = myApplications.find((a) => a.openingId === opening.id && a.status !== "withdrawn");
  if (existing) return { ok: false, reason: "You have already applied to this opening.", code: "already_applied" };

  if (myApplications.some((a) => a.status === "accepted")) {
    return { ok: false, reason: "You already have an accepted placement." };
  }

  const pending = myApplications.filter((a) => a.status === "pending").length;
  if (pending >= MAX_PENDING_APPLICATIONS) {
    return {
      ok: false,
      reason: `You can have at most ${MAX_PENDING_APPLICATIONS} pending applications. Withdraw one to apply here.`,
    };
  }

  if (opening.durationWeeks < student.requiredWeeks) {
    return {
      ok: false,
      reason: `This placement runs for ${opening.durationWeeks} weeks but your SIWES needs ${student.requiredWeeks} weeks.`,
    };
  }

  return { ok: true };
}

export type ApplicationDisplay = "pending" | "no_response" | "accepted" | "rejected" | "withdrawn";

/** A pending application with no answer after STALE_PENDING_DAYS is flagged. */
export function applicationDisplay(app: Pick<ApplicationLike, "status" | "appliedOn">, today: string): ApplicationDisplay {
  if (app.status === "pending" && daysBetween(app.appliedOn, today) > STALE_PENDING_DAYS) return "no_response";
  return app.status;
}

export const APPLICATION_LABEL: Record<ApplicationDisplay, string> = {
  pending: "Pending",
  no_response: "No response yet",
  accepted: "Accepted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export type DecideCheck = ApplyCheck;

/** Can a hub accept or reject this application today? */
export function checkCanDecide(args: {
  status: ApplicationLike["status"];
  decision: "accepted" | "rejected";
  slots: number;
  acceptedCount: number;
}): DecideCheck {
  if (args.status !== "pending") return { ok: false, reason: "This application has already been decided." };
  if (args.decision === "accepted" && slotsLeft(args.slots, args.acceptedCount) === 0) {
    return { ok: false, reason: "No slots left on this opening. Add slots or reject the application." };
  }
  return { ok: true };
}

export type PlacementState = "not_started" | "in_progress" | "completed";

export interface PlacementProgress {
  state: PlacementState;
  endDate: string;
  totalWeeks: number;
  /** 1-based week the student is in; 0 before start, totalWeeks after the end. */
  currentWeek: number;
  percent: number;
  daysToStart: number;
  daysLeft: number;
}

export function placementProgress(startDate: string, durationWeeks: number, today: string): PlacementProgress {
  const totalDays = durationWeeks * 7;
  const endDate = addDays(startDate, totalDays - 1);
  const elapsed = daysBetween(startDate, today);
  if (elapsed < 0) {
    return { state: "not_started", endDate, totalWeeks: durationWeeks, currentWeek: 0, percent: 0, daysToStart: -elapsed, daysLeft: totalDays };
  }
  if (elapsed >= totalDays) {
    return { state: "completed", endDate, totalWeeks: durationWeeks, currentWeek: durationWeeks, percent: 100, daysToStart: 0, daysLeft: 0 };
  }
  return {
    state: "in_progress",
    endDate,
    totalWeeks: durationWeeks,
    currentWeek: Math.floor(elapsed / 7) + 1,
    percent: Math.round((elapsed / totalDays) * 100),
    daysToStart: 0,
    daysLeft: totalDays - elapsed,
  };
}

export interface MatchResult {
  score: number;
  reasons: string[];
}

/**
 * How well an opening fits a student, 0 to 100.
 * Track fit is worth 50, same city 30, and enough weeks for the SIWES 20.
 */
export function matchScore(student: StudentLike, opening: { track: string; city: string; durationWeeks: number }): MatchResult {
  const reasons: string[] = [];
  let score = 0;
  const fits = COURSE_TRACKS[student.course] ?? [];
  const rank = fits.indexOf(opening.track as (typeof fits)[number]);
  if (rank === 0) {
    score += 50;
    reasons.push(`Top track for ${student.course}`);
  } else if (rank > 0) {
    score += 35;
    reasons.push(`Good fit for ${student.course}`);
  }
  if (opening.city.toLowerCase() === student.city.toLowerCase()) {
    score += 30;
    reasons.push(`In ${opening.city}`);
  }
  if (opening.durationWeeks >= student.requiredWeeks) {
    score += 20;
    reasons.push(`Covers your ${student.requiredWeeks} weeks`);
  }
  return { score, reasons };
}

/** Naira with thousands separators. 0 means unpaid. */
export function formatStipend(naira: number): string {
  if (naira <= 0) return "Unpaid";
  return `NGN ${naira.toLocaleString("en-NG")} / month`;
}
