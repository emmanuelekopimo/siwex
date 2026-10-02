import { z } from "zod";
import { CITIES, COURSES, LEVELS, SIWES_WEEKS, TRACK_IDS } from "./catalog";
import { isDateString } from "./dates";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

const base = {
  name: z.string().trim().min(3, "Enter your full name"),
  email,
  password,
};

export const studentSignUpSchema = z.object({
  ...base,
  role: z.literal("student"),
  school: z.string().trim().min(3, "Enter your school"),
  course: z.enum(COURSES as [string, ...string[]], { error: "Pick your course" }),
  level: z.coerce.number().refine((n) => LEVELS.includes(n), "Pick your level"),
  city: z.enum(CITIES as [string, ...string[]], { error: "Pick a city" }),
  requiredWeeks: z.coerce.number().refine((n) => SIWES_WEEKS.includes(n), "Pick 12 or 24 weeks"),
});

export const hubSignUpSchema = z.object({
  ...base,
  role: z.literal("hub"),
  hubName: z.string().trim().min(3, "Enter the hub name"),
  city: z.enum(CITIES as [string, ...string[]], { error: "Pick a city" }),
  address: z.string().trim().min(8, "Enter the street address"),
  about: z.string().trim().min(30, "Tell students about the hub (at least 30 characters)"),
  tracks: z.array(z.enum(TRACK_IDS)).min(1, "Pick at least one track"),
});

export const applySchema = z.object({
  openingId: z.coerce.number().int().positive(),
  note: z
    .string()
    .trim()
    .min(30, "Write at least 30 characters about why you want this placement")
    .max(600, "Keep it under 600 characters"),
});

const dateField = z.string().refine(isDateString, "Pick a valid date");

export const openingSchema = z
  .object({
    title: z.string().trim().min(5, "Enter a title of at least 5 characters"),
    track: z.enum(TRACK_IDS, { error: "Pick a track" }),
    description: z.string().trim().min(30, "Describe the work (at least 30 characters)"),
    slots: z.coerce.number().int("Use a whole number").min(1, "At least 1 slot").max(50, "At most 50 slots"),
    durationWeeks: z.coerce.number().refine((n) => SIWES_WEEKS.includes(n), "Pick 12 or 24 weeks"),
    startDate: dateField,
    deadline: dateField,
    stipendNaira: z.coerce.number().int("Use a whole number").min(0, "Cannot be negative").max(1_000_000, "Too large"),
  })
  .refine((v) => v.deadline < v.startDate, {
    path: ["deadline"],
    message: "Deadline must be before the start date",
  });

export type FieldErrors = Record<string, string>;

/** Flatten Zod issues into { field: firstMessage } for inline errors. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
}
