import { describe, expect, it } from "vitest";
import { applySchema, fieldErrors, openingSchema, studentSignUpSchema } from "@/lib/validation";
import { signSession, verifySession } from "@/lib/session";

describe("validation", () => {
  it("returns inline field errors for a bad student sign up", () => {
    const r = studentSignUpSchema.safeParse({ role: "student", name: "A", email: "nope", password: "123", school: "", course: "", level: "", city: "", requiredWeeks: "" });
    expect(r.success).toBe(false);
    const errors = fieldErrors(r.error!);
    expect(Object.keys(errors).sort()).toEqual(["city", "course", "email", "level", "name", "password", "requiredWeeks", "school"]);
    expect(errors.email).toBe("Enter a valid email address");
  });

  it("accepts a valid student and lowercases the email", () => {
    const r = studentSignUpSchema.parse({ role: "student", name: "Aniekan Bassey", email: "Aniekan@Example.COM", password: "password1", school: "University of Uyo", course: "Computer Science", level: "300", city: "Uyo", requiredWeeks: "24" });
    expect(r.email).toBe("aniekan@example.com");
    expect(r.level).toBe(300);
  });

  it("requires a meaningful application note", () => {
    const r = applySchema.safeParse({ openingId: "3", note: "pls" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).note).toContain("at least 30");
  });

  it("requires the deadline to be before the start date", () => {
    const r = openingSchema.safeParse({ title: "Mobile Intern", track: "software", description: "Build Flutter screens with the mobile team.", slots: "2", durationWeeks: "24", startDate: "2026-10-10", deadline: "2026-10-20", stipendNaira: "25000" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).deadline).toBe("Deadline must be before the start date");
  });

  it("accepts ordinary naira amounts without step issues", () => {
    const r = openingSchema.safeParse({ title: "Mobile Intern", track: "software", description: "Build Flutter screens with the mobile team.", slots: "2", durationWeeks: "24", startDate: "2026-11-10", deadline: "2026-10-20", stipendNaira: "27500" });
    expect(r.success).toBe(true);
  });
});

describe("session tokens", () => {
  it("round trips a signed session", async () => {
    const token = await signSession({ userId: 7, role: "hub", name: "Mfon Udoh" });
    expect(await verifySession(token)).toEqual({ userId: 7, role: "hub", name: "Mfon Udoh" });
  });
  it("rejects tampered tokens", async () => {
    const token = await signSession({ userId: 7, role: "student", name: "Ada" });
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});
