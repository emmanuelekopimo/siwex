import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "hub"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const students = pgTable("students", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  course: text("course").notNull(),
  level: integer("level").notNull(),
  city: text("city").notNull(),
  requiredWeeks: integer("required_weeks").notNull(),
  phone: text("phone"),
});

export const hubs = pgTable(
  "hubs",
  {
    id: serial("id").primaryKey(),
    ownerUserId: integer("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    address: text("address").notNull(),
    addressVerified: boolean("address_verified").notNull().default(false),
    about: text("about").notNull(),
    phone: text("phone"),
    website: text("website"),
    tracks: text("tracks").array().notNull(),
    color: text("color").notNull().default("#7d2ae8"),
  },
  (t) => [uniqueIndex("hubs_owner_idx").on(t.ownerUserId), index("hubs_city_idx").on(t.city)],
);

export const openings = pgTable(
  "openings",
  {
    id: serial("id").primaryKey(),
    hubId: integer("hub_id")
      .notNull()
      .references(() => hubs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    track: text("track").notNull(),
    description: text("description").notNull(),
    slots: integer("slots").notNull(),
    durationWeeks: integer("duration_weeks").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    deadline: date("deadline", { mode: "string" }).notNull(),
    stipendNaira: integer("stipend_naira").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("openings_hub_idx").on(t.hubId)],
);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    openingId: integer("opening_id")
      .notNull()
      .references(() => openings.id, { onDelete: "cascade" }),
    studentUserId: integer("student_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("pending"),
    note: text("note").notNull(),
    appliedOn: date("applied_on", { mode: "string" }).notNull(),
    decidedOn: date("decided_on", { mode: "string" }),
  },
  (t) => [
    uniqueIndex("applications_opening_student_idx").on(t.openingId, t.studentUserId),
    index("applications_student_idx").on(t.studentUserId),
  ],
);

export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Hub = typeof hubs.$inferSelect;
export type Opening = typeof openings.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationStatus = Application["status"];
