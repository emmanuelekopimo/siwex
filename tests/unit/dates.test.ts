import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDate, getToday, isDateString, relativeDays } from "@/lib/dates";

describe("dates", () => {
  it("validates YYYY-MM-DD strings", () => {
    expect(isDateString("2026-10-02")).toBe(true);
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("02/10/2026")).toBe(false);
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-10-02", "2026-10-05")).toBe(3);
    expect(daysBetween("2026-10-05", "2026-10-02")).toBe(-3);
  });

  it("uses SIWEX_TODAY when set", () => {
    expect(getToday({ SIWEX_TODAY: "2026-01-15" })).toBe("2026-01-15");
  });

  it("falls back to the Lagos date when SIWEX_TODAY is missing or invalid", () => {
    // 23:30 UTC on 1 Oct is 00:30 on 2 Oct in Lagos
    const now = new Date("2026-10-01T23:30:00Z");
    expect(getToday({}, now)).toBe("2026-10-02");
    expect(getToday({ SIWEX_TODAY: "nonsense" }, now)).toBe("2026-10-02");
  });

  it("formats dates for people", () => {
    expect(formatDate("2026-10-02")).toBe("2 Oct 2026");
    expect(relativeDays("2026-10-05", "2026-10-02")).toBe("in 3 days");
    expect(relativeDays("2026-09-28", "2026-10-02")).toBe("4 days ago");
    expect(relativeDays("2026-10-02", "2026-10-02")).toBe("today");
  });
});
