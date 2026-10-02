"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { endSession, getSession, requireRole, startSession } from "@/lib/auth";
import * as data from "@/lib/data";
import { getToday } from "@/lib/dates";
import {
  applySchema,
  fieldErrors,
  hubSignUpSchema,
  openingSchema,
  signInSchema,
  studentSignUpSchema,
  type FormState,
} from "@/lib/validation";

function values(formData: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = values(formData, ["email", "password"]);
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: raw.email } };
  const session = await data.verifyLogin(getDb(), parsed.data.email, parsed.data.password);
  if (!session) return { message: "Wrong email or password", values: { email: raw.email } };
  await startSession(session);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : session.role === "hub" ? "/hub" : "/student");
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const role = formData.get("role") === "hub" ? "hub" : "student";
  const keys =
    role === "hub"
      ? ["role", "name", "email", "password", "hubName", "city", "address", "about"]
      : ["role", "name", "email", "password", "school", "course", "level", "city", "requiredWeeks"];
  const raw = values(formData, keys);
  const db = getDb();
  const { password: _pw, ...keep } = raw;
  void _pw;

  if (role === "hub") {
    const parsed = hubSignUpSchema.safeParse({ ...raw, tracks: formData.getAll("tracks").map(String) });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keep };
    const res = await data.registerHub(db, parsed.data);
    if (!res.ok) return { errors: { email: res.reason }, values: keep };
    await startSession(res.value);
    redirect("/hub");
  }

  const parsed = studentSignUpSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keep };
  const res = await data.registerStudent(db, parsed.data);
  if (!res.ok) return { errors: { email: res.reason }, values: keep };
  await startSession(res.value);
  redirect("/student");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}

export async function applyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.role !== "student") return { message: "Sign in as a student to apply" };
  const raw = values(formData, ["openingId", "note"]);
  const parsed = applySchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const res = await data.applyToOpening(getDb(), session.userId, parsed.data, getToday());
  if (!res.ok) return { message: res.reason, values: raw };
  revalidatePath("/student");
  revalidatePath("/hubs", "layout");
  return { ok: true, message: "Application sent. Track it on your dashboard." };
}

export async function withdrawAction(formData: FormData): Promise<void> {
  const session = await requireRole("student");
  await data.withdrawApplication(getDb(), session.userId, Number(formData.get("applicationId")), getToday());
  revalidatePath("/student");
}

export async function decideAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("hub");
  const decision = formData.get("decision") === "accepted" ? "accepted" : "rejected";
  const res = await data.decideApplication(getDb(), session.userId, Number(formData.get("applicationId")), decision, getToday());
  if (!res.ok) return { message: res.reason };
  revalidatePath("/hub");
  return { ok: true, message: decision === "accepted" ? "Accepted" : "Rejected" };
}

export async function createOpeningAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("hub");
  const keys = ["title", "track", "description", "slots", "durationWeeks", "startDate", "deadline", "stipendNaira"];
  const raw = values(formData, keys);
  const parsed = openingSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const today = getToday();
  if (parsed.data.deadline < today) return { errors: { deadline: "Deadline cannot be in the past" }, values: raw };
  const res = await data.createOpening(getDb(), session.userId, parsed.data, today);
  if (!res.ok) return { message: res.reason, values: raw };
  revalidatePath("/hub");
  revalidatePath("/hubs", "layout");
  return { ok: true, message: "Opening published" };
}
