// Fixed lists used by forms, filters, seed data and the matching rules.

export const TRACKS = [
  { id: "software", label: "Software Development" },
  { id: "uiux", label: "UI/UX Design" },
  { id: "data", label: "Data Analysis" },
  { id: "marketing", label: "Digital Marketing" },
  { id: "networking", label: "Networking and Cloud" },
  { id: "hardware", label: "Hardware and IoT" },
  { id: "product", label: "Product Management" },
] as const;

export type TrackId = (typeof TRACKS)[number]["id"];
export const TRACK_IDS = TRACKS.map((t) => t.id) as [TrackId, ...TrackId[]];

export function trackLabel(id: string): string {
  return TRACKS.find((t) => t.id === id)?.label ?? id;
}

/** Courses a student can pick, and the tracks that fit each course best. */
export const COURSE_TRACKS: Record<string, TrackId[]> = {
  "Computer Science": ["software", "data", "uiux", "networking"],
  "Software Engineering": ["software", "uiux", "product"],
  "Information Technology": ["networking", "software", "data"],
  "Computer Engineering": ["hardware", "software", "networking"],
  "Electrical/Electronic Engineering": ["hardware", "networking"],
  "Statistics": ["data"],
  "Mathematics": ["data", "software"],
  "Mass Communication": ["marketing", "uiux"],
  "Business Administration": ["product", "marketing"],
  "Fine and Applied Arts": ["uiux", "marketing"],
};

export const COURSES = Object.keys(COURSE_TRACKS);

export const CITIES = ["Uyo", "Eket", "Ikot Ekpene", "Calabar", "Port Harcourt", "Lagos", "Abuja", "Enugu", "Ibadan", "Kaduna", "Ilorin"];

export const LEVELS = [200, 300, 400, 500];

/** SIWES lengths in weeks: 12 weeks (3 months) or 24 weeks (6 months). */
export const SIWES_WEEKS = [12, 24];

/** State for each city, used when a hub registers. */
export const CITY_STATE: Record<string, string> = {
  Uyo: "Akwa Ibom",
  Eket: "Akwa Ibom",
  "Ikot Ekpene": "Akwa Ibom",
  Calabar: "Cross River",
  "Port Harcourt": "Rivers",
  Lagos: "Lagos",
  Abuja: "FCT",
  Enugu: "Enugu",
  Ibadan: "Oyo",
  Kaduna: "Kaduna",
  Ilorin: "Kwara",
};
