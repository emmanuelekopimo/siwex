// Demo data, dated relative to "today" so the demo always has open, closing
// soon, full and closed openings plus pending, stale, accepted and rejected
// applications.

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import type { DB } from "./index";
import { applications, hubs, openings, students, users } from "./schema";
import { addDays } from "@/lib/dates";

import { DEMO_HUB_EMAIL, DEMO_PASSWORD, DEMO_STUDENT_EMAIL } from "@/lib/demo";

export { DEMO_HUB_EMAIL, DEMO_PASSWORD, DEMO_STUDENT_EMAIL };

type HubSeed = {
  key: string;
  owner: { name: string; email: string };
  hub: Omit<typeof hubs.$inferInsert, "ownerUserId">;
};

const HUBS: HubSeed[] = [
  {
    key: "futty",
    owner: { name: "Ubong Etuk", email: "futtybills@siwex.ng" },
    hub: {
      slug: "futtybills",
      name: "Futtybills",
      city: "Uyo",
      state: "Akwa Ibom",
      address: "Nwaniba Road, Uyo",
      addressVerified: false,
      about:
        "Futtybills is a software and fintech studio in Uyo that builds bill payment and business tools. SIWES students join live product squads and ship code to real users under a senior engineer.",
      tracks: ["software", "data", "product"],
      color: "#ff6b35",
    },
  },
  {
    key: "start",
    owner: { name: "Mfon Udoh", email: DEMO_HUB_EMAIL },
    hub: {
      slug: "start-innovation-hub",
      name: "Start Innovation Hub",
      city: "Uyo",
      state: "Akwa Ibom",
      address: "Plot 6, Unit C, Ewet Housing Estate, Uyo",
      addressVerified: true,
      phone: "+234 810 735 8445",
      website: "starthub.com.ng",
      about:
        "Start Innovation Hub is a growth accelerator and NBTE approved skills training centre in Uyo. It runs training in web and mobile development, product design and digital marketing, with co-working space for startups.",
      tracks: ["software", "uiux", "marketing"],
      color: "#7d2ae8",
    },
  },
  {
    key: "root",
    owner: { name: "Aniebiet Ekanem", email: "roothub@siwex.ng" },
    hub: {
      slug: "the-roothub",
      name: "The RootHub",
      city: "Uyo",
      state: "Akwa Ibom",
      address: "AKEES Plaza, opposite Ibom Hall, IBB Avenue, Uyo",
      addressVerified: true,
      phone: "0809 242 7901",
      about:
        "The RootHub started in 2014 as one of the first co-working spaces in Uyo and grew into an incubation and acceleration hub. Interns work with resident startups on product, engineering and growth.",
      tracks: ["product", "software", "marketing"],
      color: "#00a19b",
    },
  },
  {
    key: "square",
    owner: { name: "Ekaette Umoh", email: "squareone@siwex.ng" },
    hub: {
      slug: "square-one",
      name: "Square One",
      city: "Uyo",
      state: "Akwa Ibom",
      address: "Oron Road, Uyo",
      addressVerified: false,
      about:
        "Square One is a tech hub for beginners in Uyo. It offers structured SIWES tracks in product design, data analysis and IT support, with weekly reviews and a logbook sign-off every Friday.",
      tracks: ["uiux", "data", "networking"],
      color: "#2d6cdf",
    },
  },
  {
    key: "chain",
    owner: { name: "Kufre Edet", email: "chainspace@siwex.ng" },
    hub: {
      slug: "chainspace-hq",
      name: "Chainspace HQ",
      city: "Uyo",
      state: "Akwa Ibom",
      address: "Udo Udoma Avenue, Uyo",
      addressVerified: false,
      about:
        "Chainspace HQ is a co-working and innovation space in Uyo for remote workers, freelancers and founders. Its infrastructure team takes interns for networking, cloud and hardware support.",
      tracks: ["networking", "hardware"],
      color: "#1f8a4c",
    },
  },
  {
    key: "cchub",
    owner: { name: "Bolaji Adebayo", email: "cchub@siwex.ng" },
    hub: {
      slug: "co-creation-hub",
      name: "Co-Creation Hub",
      city: "Lagos",
      state: "Lagos",
      address: "294 Herbert Macaulay Way, Yaba, Lagos",
      addressVerified: true,
      website: "cchubnigeria.com",
      about:
        "Co-Creation Hub in Yaba is one of the largest innovation centres in Africa. Its hardware lab and partner startups take a small number of SIWES students each year.",
      tracks: ["hardware", "software", "product"],
      color: "#e0457b",
    },
  },
];

type OpeningSeed = {
  key: string;
  hub: string;
  title: string;
  track: string;
  slots: number;
  weeks: number;
  start: number; // days from today
  deadline: number; // days from today
  stipend: number;
  description: string;
};

const OPENINGS: OpeningSeed[] = [
  { key: "S1", hub: "start", title: "Frontend Developer Intern (React)", track: "software", slots: 4, weeks: 24, start: 30, deadline: 3, stipend: 30000,
    description: "Build pages and components for client projects with React and TypeScript. You will pair with a mentor, review pull requests and present a demo every two weeks." },
  { key: "S2", hub: "start", title: "UI/UX Design Intern", track: "uiux", slots: 2, weeks: 24, start: 30, deadline: 20, stipend: 25000,
    description: "Design screens in Figma, run quick user tests with traders in Uyo markets and hand off designs to the development team." },
  { key: "S3", hub: "start", title: "Digital Marketing Intern", track: "marketing", slots: 2, weeks: 12, start: -35, deadline: -45, stipend: 20000,
    description: "Plan social media content, write copy and track campaign results for hub programmes and partner startups." },
  { key: "R1", hub: "root", title: "Product Operations Intern", track: "product", slots: 3, weeks: 24, start: 21, deadline: 12, stipend: 35000,
    description: "Support resident startups with user interviews, backlog grooming and weekly product reports. Good for students who like both people and spreadsheets." },
  { key: "R2", hub: "root", title: "Backend Developer Intern (Node.js)", track: "software", slots: 2, weeks: 24, start: 14, deadline: 10, stipend: 35000,
    description: "Write and test REST APIs with Node.js and PostgreSQL for an incubated logistics startup." },
  { key: "F1", hub: "futty", title: "Junior Software Engineer Intern", track: "software", slots: 3, weeks: 24, start: 28, deadline: 18, stipend: 40000,
    description: "Join the payments squad. Fix bugs, write tests and ship small features to the Futtybills web app with code review from senior engineers." },
  { key: "F2", hub: "futty", title: "Data Analyst Intern", track: "data", slots: 2, weeks: 24, start: 28, deadline: 18, stipend: 30000,
    description: "Clean transaction data, build dashboards and write short weekly insight reports for the operations team." },
  { key: "Q1", hub: "square", title: "Product Design Intern", track: "uiux", slots: 2, weeks: 24, start: 25, deadline: 15, stipend: 0,
    description: "Learn the design process from research to prototype. Weekly critiques with the design lead and a portfolio review at the end." },
  { key: "Q2", hub: "square", title: "IT Support and Networking Intern", track: "networking", slots: 3, weeks: 12, start: 10, deadline: -2, stipend: 15000,
    description: "Set up and maintain the hub network, troubleshoot devices and document fixes for members." },
  { key: "Q3", hub: "square", title: "Data Analysis Intern", track: "data", slots: 2, weeks: 24, start: 40, deadline: 25, stipend: 20000,
    description: "Use Excel, SQL and Power BI on small business datasets. Ends with a capstone report you can attach to your SIWES logbook." },
  { key: "C1", hub: "chain", title: "Cloud and Networking Intern", track: "networking", slots: 2, weeks: 24, start: 20, deadline: 6, stipend: 25000,
    description: "Help run the space network, monitor uptime and deploy small services on cloud servers." },
  { key: "C2", hub: "chain", title: "IoT Hardware Intern", track: "hardware", slots: 2, weeks: 24, start: 35, deadline: 22, stipend: 25000,
    description: "Prototype sensors and smart power monitors with Arduino and ESP32 boards for hub members." },
  { key: "X1", hub: "cchub", title: "Hardware Lab Intern", track: "hardware", slots: 3, weeks: 24, start: 30, deadline: 14, stipend: 50000,
    description: "Work in the hardware lab on 3D printing, PCB assembly and device testing for partner startups." },
  { key: "X2", hub: "cchub", title: "Software Engineering Intern", track: "software", slots: 5, weeks: 24, start: 20, deadline: -1, stipend: 50000,
    description: "Build internal tools with partner startups. Applications for this cohort have closed." },
];

type StudentSeed = {
  name: string;
  email: string;
  school: string;
  course: string;
  level: number;
  city: string;
  weeks: number;
  apps: { opening: string; status: "pending" | "accepted" | "rejected"; applied: number; decided?: number }[];
};

const STUDENTS: StudentSeed[] = [
  { name: "Imaobong Udo", email: DEMO_STUDENT_EMAIL, school: "University of Uyo", course: "Computer Science", level: 300, city: "Uyo", weeks: 24,
    apps: [
      { opening: "S1", status: "pending", applied: -4 },
      { opening: "Q1", status: "pending", applied: -16 },
      { opening: "X2", status: "rejected", applied: -30, decided: -12 },
    ] },
  { name: "Ekemini Akpan", email: "ekemini@siwex.ng", school: "Akwa Ibom State University", course: "Software Engineering", level: 300, city: "Uyo", weeks: 24,
    apps: [
      { opening: "S1", status: "pending", applied: -12 },
      { opening: "R1", status: "pending", applied: -3 },
    ] },
  { name: "Nsikak Etim", email: "nsikak@siwex.ng", school: "University of Uyo", course: "Mass Communication", level: 400, city: "Uyo", weeks: 12,
    apps: [{ opening: "S3", status: "accepted", applied: -60, decided: -50 }] },
  { name: "Fatima Bello", email: "fatima@siwex.ng", school: "Akwa Ibom State Polytechnic", course: "Business Administration", level: 300, city: "Uyo", weeks: 12,
    apps: [{ opening: "S3", status: "accepted", applied: -58, decided: -49 }] },
  { name: "Aniekan Bassey", email: "aniekan@siwex.ng", school: "University of Uyo", course: "Fine and Applied Arts", level: 300, city: "Uyo", weeks: 24,
    apps: [{ opening: "S2", status: "pending", applied: -2 }] },
  { name: "Chiamaka Obi", email: "chiamaka@siwex.ng", school: "University of Calabar", course: "Computer Science", level: 300, city: "Calabar", weeks: 24,
    apps: [{ opening: "S1", status: "pending", applied: -6 }] },
  { name: "Emem Essien", email: "emem@siwex.ng", school: "University of Uyo", course: "Information Technology", level: 300, city: "Uyo", weeks: 24,
    apps: [
      { opening: "R2", status: "accepted", applied: -20, decided: -9 },
      { opening: "Q2", status: "rejected", applied: -25, decided: -15 },
    ] },
  { name: "Ifiok Johnson", email: "ifiok@siwex.ng", school: "Akwa Ibom State University", course: "Computer Science", level: 400, city: "Uyo", weeks: 24,
    apps: [{ opening: "R2", status: "accepted", applied: -19, decided: -8 }] },
  { name: "Uduak Ekpo", email: "uduak@siwex.ng", school: "University of Uyo", course: "Statistics", level: 300, city: "Uyo", weeks: 24,
    apps: [{ opening: "F2", status: "pending", applied: -1 }] },
  { name: "Tunde Adeyemi", email: "tunde@siwex.ng", school: "University of Lagos", course: "Computer Engineering", level: 400, city: "Lagos", weeks: 24,
    apps: [{ opening: "X1", status: "pending", applied: -3 }] },
  { name: "Ifeanyi Okafor", email: "ifeanyi@siwex.ng", school: "University of Nigeria, Nsukka", course: "Electrical/Electronic Engineering", level: 400, city: "Enugu", weeks: 24,
    apps: [{ opening: "C1", status: "pending", applied: -8 }] },
];

export async function clearAll(db: DB): Promise<void> {
  await db.execute(sql`TRUNCATE applications, openings, hubs, students, users RESTART IDENTITY CASCADE`);
}

export async function isEmpty(db: DB): Promise<boolean> {
  const res = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM users`);
  return Number(res.rows[0]?.n ?? 0) === 0;
}

export async function seed(db: DB, today: string): Promise<{ users: number; hubs: number; openings: number; applications: number }> {
  // cost 8 keeps seeding fast; real sign-ups use cost 10
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 8);
  const hubIds = new Map<string, number>();
  const openingIds = new Map<string, number>();
  let appCount = 0;

  await db.transaction(async (tx) => {
    for (const h of HUBS) {
      const [u] = await tx.insert(users).values({ ...h.owner, passwordHash, role: "hub" }).returning({ id: users.id });
      const [row] = await tx.insert(hubs).values({ ...h.hub, ownerUserId: u.id }).returning({ id: hubs.id });
      hubIds.set(h.key, row.id);
    }
    for (const o of OPENINGS) {
      const [row] = await tx
        .insert(openings)
        .values({
          hubId: hubIds.get(o.hub)!,
          title: o.title,
          track: o.track,
          description: o.description,
          slots: o.slots,
          durationWeeks: o.weeks,
          startDate: addDays(today, o.start),
          deadline: addDays(today, o.deadline),
          stipendNaira: o.stipend,
        })
        .returning({ id: openings.id });
      openingIds.set(o.key, row.id);
    }
    for (const s of STUDENTS) {
      const [u] = await tx.insert(users).values({ name: s.name, email: s.email, passwordHash, role: "student" }).returning({ id: users.id });
      await tx.insert(students).values({
        userId: u.id,
        school: s.school,
        course: s.course,
        level: s.level,
        city: s.city,
        requiredWeeks: s.weeks,
      });
      for (const a of s.apps) {
        await tx.insert(applications).values({
          openingId: openingIds.get(a.opening)!,
          studentUserId: u.id,
          status: a.status,
          note: `I am a ${s.level} level ${s.course} student at ${s.school} and I want hands-on experience in this role for my SIWES.`,
          appliedOn: addDays(today, a.applied),
          decidedOn: a.decided === undefined ? null : addDays(today, a.decided),
        });
        appCount++;
      }
    }
  });

  return { users: HUBS.length + STUDENTS.length, hubs: HUBS.length, openings: OPENINGS.length, applications: appCount };
}
