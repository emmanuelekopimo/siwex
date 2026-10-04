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
  {
    key: "kode",
    owner: { name: "Idara Okon", email: "kodehauz@siwex.ng" },
    hub: {
      slug: "kodehauz",
      name: "KodeHauz",
      city: "Eket",
      state: "Akwa Ibom",
      address: "38 Afaha Uqua Road, Eket",
      addressVerified: true,
      website: "kodehauz.com",
      about:
        "KodeHauz is a software company and training hub in Eket. Interns build web and mobile products for local businesses and learn version control, testing and client communication.",
      tracks: ["software", "uiux"],
      color: "#0e8a7f",
    },
  },
  {
    key: "lead",
    owner: { name: "Tolu Bankole", email: "leadspace@siwex.ng" },
    hub: {
      slug: "leadspace-yaba",
      name: "Leadspace",
      city: "Lagos",
      state: "Lagos",
      address: "10 Hughes Avenue, off Murtala Muhammed Way, Yaba, Lagos",
      addressVerified: true,
      about:
        "Leadspace is a co-working space in Yaba for founders, freelancers and remote teams. Its member startups take SIWES students in design, marketing and product roles.",
      tracks: ["marketing", "uiux", "product"],
      color: "#ff6937",
    },
  },
  {
    key: "vp",
    owner: { name: "Hauwa Musa", email: "venturespark@siwex.ng" },
    hub: {
      slug: "ventures-park",
      name: "Ventures Park",
      city: "Abuja",
      state: "FCT",
      address: "18 Khartoum Street, Wuse II, Abuja",
      addressVerified: true,
      about:
        "Ventures Park is a large innovation hub in Wuse II run by the Ventures Platform group. It hosts startups, training programmes and events, and places interns with resident companies.",
      tracks: ["software", "product", "data"],
      color: "#7356bf",
    },
  },
  {
    key: "wenn",
    owner: { name: "Adebola Ogunleye", email: "wennovation@siwex.ng" },
    hub: {
      slug: "wennovation-hub",
      name: "Wennovation Hub",
      city: "Ibadan",
      state: "Oyo",
      address: "3rd Floor, Alpha and Omega Building, Queen Elizabeth II Road, Mokola, Ibadan",
      addressVerified: true,
      phone: "+234 912 797 2803",
      about:
        "Wennovation Hub supports startups in agriculture, health and education across the south west. SIWES students help with research, data collection and product support.",
      tracks: ["data", "product", "marketing"],
      color: "#c27c0e",
    },
  },
  {
    key: "colab",
    owner: { name: "Aisha Bello", email: "colab@siwex.ng" },
    hub: {
      slug: "colab-kaduna",
      name: "CoLab",
      city: "Kaduna",
      state: "Kaduna",
      address: "4 Barnawa Close, Barnawa, Kaduna",
      addressVerified: true,
      phone: "+234 815 555 6990",
      about:
        "CoLab is an innovation hub and co-working space in Kaduna. It runs coding, design and hardware programmes and connects interns with startups in the north.",
      tracks: ["software", "hardware", "uiux"],
      color: "#99644c",
    },
  },
  {
    key: "roar",
    owner: { name: "Chidera Nwosu", email: "roar@siwex.ng" },
    hub: {
      slug: "roar-nigeria-hub",
      name: "Roar Nigeria Hub",
      city: "Enugu",
      state: "Enugu",
      address: "Ademola Street, Ogui, Enugu",
      addressVerified: true,
      phone: "+234 809 941 3182",
      about:
        "Roar Nigeria Hub started at the University of Nigeria, Nsukka and now has an Enugu campus. It focuses on student innovators and runs a structured internship track.",
      tracks: ["software", "data", "product"],
      color: "#e11900",
    },
  },
  {
    key: "harv",
    owner: { name: "Tamuno Briggs", email: "harvoxx@siwex.ng" },
    hub: {
      slug: "harvoxx-tech-hub",
      name: "Harvoxx Tech Hub",
      city: "Port Harcourt",
      state: "Rivers",
      address: "Alcon Road, Woji Housing Estate, Port Harcourt",
      addressVerified: true,
      about:
        "Harvoxx Tech Hub trains young people in software, cloud and cybersecurity in Port Harcourt. Interns support live client projects and the hub network.",
      tracks: ["software", "networking"],
      color: "#1b1b1b",
    },
  },
  {
    key: "trax",
    owner: { name: "Ibiere George", email: "spacetrax@siwex.ng" },
    hub: {
      slug: "spacetrax-innovation-hub",
      name: "SpaceTrax Innovation Hub",
      city: "Port Harcourt",
      state: "Rivers",
      address: "Ada-George Road, Port Harcourt",
      addressVerified: true,
      about:
        "SpaceTrax gives startups and small businesses affordable office space and support. Its operations and growth teams take SIWES students every quarter.",
      tracks: ["marketing", "product"],
      color: "#276ef1",
    },
  },
  {
    key: "iih",
    owner: { name: "Yusuf Abdullahi", email: "ilorinhub@siwex.ng" },
    hub: {
      slug: "ilorin-innovation-hub",
      name: "Ilorin Innovation Hub",
      city: "Ilorin",
      state: "Kwara",
      address: "Ahmadu Bello Way, Ilorin",
      addressVerified: true,
      phone: "+234 916 000 9351",
      about:
        "Ilorin Innovation Hub is a technology centre for startups and digital skills in Kwara State, with co-working space, labs and training programmes.",
      tracks: ["data", "networking", "hardware"],
      color: "#1f7a8c",
    },
  },
  {
    key: "guru",
    owner: { name: "Effiong Asuquo", email: "guru@siwex.ng" },
    hub: {
      slug: "guru-innovation-hub",
      name: "Guru Innovation Hub",
      city: "Calabar",
      state: "Cross River",
      address: "Eta Agbor, Calabar",
      addressVerified: false,
      about:
        "Guru Innovation Hub is a community for startups, developers and creatives in Calabar, with mentoring, events and hands-on projects for interns.",
      tracks: ["software", "uiux", "marketing"],
      color: "#d6457a",
    },
  },
  {
    key: "lift",
    owner: { name: "Okon Bassey", email: "lifthub@siwex.ng" },
    hub: {
      slug: "lift-hub-calabar",
      name: "Lift Hub",
      city: "Calabar",
      state: "Cross River",
      address: "6A Housing Estate Road, off Ndidem Usang Iso (Marian), Calabar",
      addressVerified: true,
      about:
        "Lift Hub is a training and co-working space in Calabar for digital skills, with short courses and supervised SIWES placements in IT support and design.",
      tracks: ["networking", "uiux"],
      color: "#3f8f29",
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
  { key: "K1", hub: "kode", title: "Mobile Developer Intern (Flutter)", track: "software", slots: 3, weeks: 24, start: 30, deadline: 21, stipend: 30000,
    description: "Build Flutter screens for a delivery app used by shops in Eket and Uyo, with code review twice a week." },
  { key: "K2", hub: "kode", title: "UI Designer Intern", track: "uiux", slots: 2, weeks: 24, start: 30, deadline: 21, stipend: 25000,
    description: "Design app flows in Figma and test them with real customers before handing over to developers." },
  { key: "L1", hub: "lead", title: "Content and Social Media Intern", track: "marketing", slots: 3, weeks: 12, start: 20, deadline: 9, stipend: 35000,
    description: "Plan and post content for member startups, track engagement and write a weekly report." },
  { key: "L2", hub: "lead", title: "Product Design Intern", track: "uiux", slots: 2, weeks: 24, start: 28, deadline: 16, stipend: 40000,
    description: "Work with two startups on onboarding flows, from research notes to clickable prototypes." },
  { key: "L3", hub: "lead", title: "Community Operations Intern", track: "product", slots: 2, weeks: 12, start: 14, deadline: -3, stipend: 30000,
    description: "Run member onboarding and events at the space. This cohort is closed." },
  { key: "V1", hub: "vp", title: "Software Engineering Intern (Backend)", track: "software", slots: 4, weeks: 24, start: 35, deadline: 24, stipend: 60000,
    description: "Build APIs in Go and Node.js with a resident fintech team, including tests and on-call shadowing." },
  { key: "V2", hub: "vp", title: "Data Analyst Intern", track: "data", slots: 2, weeks: 24, start: 35, deadline: 24, stipend: 50000,
    description: "Build dashboards and clean data for portfolio companies using SQL and Python." },
  { key: "V3", hub: "vp", title: "Product Management Intern", track: "product", slots: 2, weeks: 24, start: 35, deadline: 5, stipend: 50000,
    description: "Write specs, run sprint ceremonies and talk to users with a product lead." },
  { key: "W1", hub: "wenn", title: "Research and Data Intern", track: "data", slots: 3, weeks: 24, start: 25, deadline: 13, stipend: 25000,
    description: "Collect and analyse field data from agritech pilots across Oyo State." },
  { key: "W2", hub: "wenn", title: "Growth Marketing Intern", track: "marketing", slots: 2, weeks: 12, start: 25, deadline: 13, stipend: 25000,
    description: "Run email and social campaigns for health and education startups." },
  { key: "CL1", hub: "colab", title: "Hardware Prototyping Intern", track: "hardware", slots: 2, weeks: 24, start: 30, deadline: 19, stipend: 30000,
    description: "Build and test solar monitoring prototypes in the CoLab maker space." },
  { key: "CL2", hub: "colab", title: "Frontend Developer Intern", track: "software", slots: 3, weeks: 24, start: 30, deadline: 19, stipend: 30000,
    description: "Ship React features for startups in the CoLab programme." },
  { key: "RN1", hub: "roar", title: "Software Developer Intern", track: "software", slots: 4, weeks: 24, start: 21, deadline: 11, stipend: 25000,
    description: "Work on student-led products with mentors from the hub and partner companies." },
  { key: "RN2", hub: "roar", title: "Data Science Intern", track: "data", slots: 2, weeks: 24, start: 21, deadline: 4, stipend: 25000,
    description: "Clean datasets and build simple models with the research team." },
  { key: "H1", hub: "harv", title: "Cloud Support Intern", track: "networking", slots: 3, weeks: 24, start: 18, deadline: 8, stipend: 35000,
    description: "Set up servers, monitor uptime and document fixes for client systems." },
  { key: "H2", hub: "harv", title: "Junior Web Developer Intern", track: "software", slots: 3, weeks: 24, start: 18, deadline: 8, stipend: 35000,
    description: "Build websites for small businesses in Port Harcourt with a senior developer." },
  { key: "T1", hub: "trax", title: "Business Operations Intern", track: "product", slots: 2, weeks: 12, start: 15, deadline: 10, stipend: 30000,
    description: "Support member onboarding, billing and reporting for the operations team." },
  { key: "T2", hub: "trax", title: "Digital Marketing Intern", track: "marketing", slots: 2, weeks: 12, start: 15, deadline: 10, stipend: 30000,
    description: "Create content and run paid ads for member businesses." },
  { key: "I1", hub: "iih", title: "Network Support Intern", track: "networking", slots: 3, weeks: 24, start: 26, deadline: 17, stipend: 25000,
    description: "Maintain the hub network and help run digital skills classes." },
  { key: "I2", hub: "iih", title: "IoT Lab Intern", track: "hardware", slots: 2, weeks: 24, start: 26, deadline: 17, stipend: 25000,
    description: "Build sensor projects in the lab and document them for the community." },
  { key: "G1", hub: "guru", title: "Web Developer Intern", track: "software", slots: 3, weeks: 24, start: 24, deadline: 14, stipend: 20000,
    description: "Build and maintain websites for hub members and local businesses." },
  { key: "G2", hub: "guru", title: "Graphic and UI Design Intern", track: "uiux", slots: 2, weeks: 12, start: 24, deadline: 14, stipend: 20000,
    description: "Design social media graphics and simple app screens for members." },
  { key: "LF1", hub: "lift", title: "IT Support Intern", track: "networking", slots: 4, weeks: 12, start: 12, deadline: 6, stipend: 15000,
    description: "Help learners and members with devices, network and software issues." },
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
  { name: "Oluwaseun Adebayo", email: "seun@siwex.ng", school: "University of Ibadan", course: "Statistics", level: 300, city: "Ibadan", weeks: 24,
    apps: [{ opening: "W1", status: "accepted", applied: -14, decided: -6 }] },
  { name: "Zainab Lawal", email: "zainab@siwex.ng", school: "Kaduna State University", course: "Computer Science", level: 300, city: "Kaduna", weeks: 24,
    apps: [{ opening: "CL2", status: "pending", applied: -5 }, { opening: "CL1", status: "pending", applied: -2 }] },
  { name: "Chukwuemeka Eze", email: "emeka@siwex.ng", school: "University of Nigeria, Nsukka", course: "Computer Science", level: 400, city: "Enugu", weeks: 24,
    apps: [{ opening: "RN1", status: "accepted", applied: -12, decided: -4 }] },
  { name: "Blessing Amadi", email: "blessing@siwex.ng", school: "Rivers State University", course: "Information Technology", level: 300, city: "Port Harcourt", weeks: 24,
    apps: [{ opening: "H1", status: "pending", applied: -13 }] },
  { name: "Victor Ogbonna", email: "victor@siwex.ng", school: "University of Port Harcourt", course: "Software Engineering", level: 300, city: "Port Harcourt", weeks: 24,
    apps: [{ opening: "H2", status: "accepted", applied: -10, decided: -3 }] },
  { name: "Halima Sani", email: "halima@siwex.ng", school: "University of Abuja", course: "Business Administration", level: 400, city: "Abuja", weeks: 24,
    apps: [{ opening: "V3", status: "pending", applied: -6 }] },
  { name: "Tobi Ajayi", email: "tobi@siwex.ng", school: "Yaba College of Technology", course: "Mass Communication", level: 300, city: "Lagos", weeks: 12,
    apps: [{ opening: "L1", status: "accepted", applied: -8, decided: -2 }] },
  { name: "Kemi Ogunbiyi", email: "kemi@siwex.ng", school: "University of Lagos", course: "Fine and Applied Arts", level: 300, city: "Lagos", weeks: 24,
    apps: [{ opening: "L2", status: "pending", applied: -4 }] },
  { name: "Abdulrahman Bako", email: "abdul@siwex.ng", school: "University of Ilorin", course: "Electrical/Electronic Engineering", level: 400, city: "Ilorin", weeks: 24,
    apps: [{ opening: "I2", status: "accepted", applied: -9, decided: -1 }] },
  { name: "Mercy Edet", email: "mercy@siwex.ng", school: "University of Calabar", course: "Computer Science", level: 300, city: "Calabar", weeks: 24,
    apps: [{ opening: "G1", status: "pending", applied: -3 }] },
  { name: "Idorenyin Akpan", email: "idorenyin@siwex.ng", school: "Akwa Ibom State Polytechnic", course: "Computer Engineering", level: 300, city: "Eket", weeks: 24,
    apps: [{ opening: "K1", status: "accepted", applied: -11, decided: -5 }] },
  { name: "David Okoro", email: "david@siwex.ng", school: "Federal University of Technology, Owerri", course: "Computer Science", level: 400, city: "Abuja", weeks: 24,
    apps: [{ opening: "V1", status: "accepted", applied: -7, decided: -2 }] },
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
