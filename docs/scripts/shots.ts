// Takes the documentation screenshots with Playwright and draws numbered
// callouts on key elements. Each shot lists its callouts so the PDF can
// explain them under the image.
import path from "node:path";
import { chromium, devices, type Browser, type Page } from "@playwright/test";

export interface Callout {
  selector: string;
  index?: number;
  text: string;
}

export interface Shot {
  id: string;
  title: string;
  intro: string;
  file: string;
  callouts: Callout[];
  mobile?: boolean;
}

type Step = {
  id: string;
  title: string;
  intro: string;
  mobile?: boolean;
  fullPage?: boolean;
  run: (page: Page) => Promise<void>;
  callouts: Callout[];
};

async function signIn(page: Page, base: string, as: "student" | "hub") {
  await page.context().clearCookies();
  await page.goto(`${base}${as === "hub" ? "/sign-in?demo=hub" : "/sign-in"}`);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(as === "hub" ? "**/hub" : "**/student");
}

async function drawCallouts(page: Page, callouts: Callout[]) {
  await page.evaluate((items) => {
    document.querySelectorAll("[data-callout]").forEach((n) => n.remove());
    items.forEach((c, i) => {
      const el = document.querySelectorAll(c.selector)[c.index ?? 0] as HTMLElement | undefined;
      if (!el) throw new Error(`Callout target not found: ${c.selector}`);
      const r = el.getBoundingClientRect();
      const x = r.left + window.scrollX;
      const y = r.top + window.scrollY;
      const box = document.createElement("div");
      box.dataset.callout = "1";
      Object.assign(box.style, {
        position: "absolute", left: `${x - 4}px`, top: `${y - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px`,
        border: "3px solid #ff3d7f", borderRadius: "12px", zIndex: "9998", pointerEvents: "none",
      });
      const badge = document.createElement("div");
      badge.dataset.callout = "1";
      badge.textContent = String(i + 1);
      Object.assign(badge.style, {
        position: "absolute", left: `${Math.max(2, x - 16)}px`, top: `${Math.max(2, y - 16)}px`, width: "28px", height: "28px",
        borderRadius: "50%", background: "#ff3d7f", color: "#fff", font: "800 15px 'Plus Jakarta Sans', sans-serif",
        display: "grid", placeItems: "center", zIndex: "9999", boxShadow: "0 2px 6px rgba(0,0,0,.3)", pointerEvents: "none",
      });
      document.body.append(box, badge);
    });
  }, callouts);
}

export async function takeShots(base: string, outDir: string): Promise<Shot[]> {
  const executablePath = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser: Browser = await chromium.launch({ executablePath });

  const steps: Step[] = [
    {
      id: "home", title: "Home page", intro: "The landing page a student sees first. It explains the product in one line and lets them search straight away.",
      run: async (p) => { await p.goto(`${base}/`); },
      callouts: [
        { selector: ".searchbar", text: "Search box. Sends the student to the hub directory with the keyword filled in." },
        { selector: ".stat-pills", text: "Live counts from the database: hubs listed, open slots left and students already placed." },
        { selector: "[data-testid=hub-card]", text: "Hub cards sorted by open slots. Each shows tracks offered and slots left." },
        { selector: ".site-header .btn", text: "Sign in. The demo account is filled in on the next page." },
      ],
    },
    {
      id: "hubs", title: "Hub directory", intro: "All hubs with filters for keyword, city and track. The filters are plain query parameters, so a filtered list can be shared as a link.",
      run: async (p) => { await p.goto(`${base}/hubs`); },
      callouts: [
        { selector: ".filters", text: "Keyword, city and track filters. Selects stay uncontrolled so a form submit never wipes them." },
        { selector: "[data-testid=result-count]", text: "Number of hubs matching the filters." },
        { selector: "[data-testid=hub-card] .badge", text: "Slots left across all live openings at the hub. Grey when nothing is open." },
        { selector: "[data-testid=hub-card] svg[aria-label='Address verified']", text: "Green tick: the street address was checked against a public source." },
      ],
    },
    {
      id: "hub-detail", title: "Hub page", intro: "Every opening at a hub with its status, slots, length, stipend and deadline. Live openings are listed first.",
      run: async (p) => { await p.goto(`${base}/hubs/start-innovation-hub`); },
      callouts: [
        { selector: "[data-testid=opening-status]", text: "Status badge worked out from the deadline and accepted count: Open, Closing soon (7 days or less), Full or Closed." },
        { selector: ".opening .meta", text: "Slots left, placement length, start date and monthly stipend in naira." },
        { selector: ".opening .small.bold", text: "Deadline with a countdown relative to today." },
        { selector: ".opening .btn.secondary", text: "Visitors who are not signed in are asked to sign in as a student." },
        { selector: "aside .badge", text: "Address verified badge. Hubs whose address could not be confirmed show Address to be confirmed instead." },
      ],
    },
    {
      id: "sign-in", title: "Sign in", intro: "Email and password sign in. The demo login is pre-filled so the presenter only clicks one button.",
      run: async (p) => { await p.context().clearCookies(); await p.goto(`${base}/sign-in`); },
      callouts: [
        { selector: ".role-tabs", text: "Switch between the student demo and the hub demo account." },
        { selector: "[data-testid=demo-box]", text: "The demo credentials, shown in plain text for the presentation." },
        { selector: "form .btn", text: "Sign in. On success a signed JWT is stored in an HTTP-only cookie." },
      ],
    },
    {
      id: "sign-up", title: "Create an account", intro: "Students and hubs register on the same page. Zod validates every field on the server and errors appear under each field.",
      run: async (p) => { await p.goto(`${base}/sign-up`); await p.getByRole("button", { name: "Create account" }).click(); await p.getByText("Enter your full name").waitFor(); },
      callouts: [
        { selector: ".role-tabs", text: "Pick student or hub. The hub form asks for hub name, address, about text and tracks." },
        { selector: ".field-error", text: "Inline field error returned from the Server Action after Zod validation." },
        { selector: "#requiredWeeks", text: "SIWES length (12 or 24 weeks). Used later to block placements that are too short." },
      ],
    },
    {
      id: "student", title: "Student dashboard", intro: "Signed in as Imaobong Udo, a 300 level Computer Science student at the University of Uyo.",
      run: async (p) => { await signIn(p, base, "student"); },
      callouts: [
        { selector: "[data-testid=stale-alert]", text: "Warning when an application has had no reply for more than 10 days." },
        { selector: "[data-testid=application-status]", index: 1, text: "Status per application: Pending, No response yet, Accepted, Not selected or Withdrawn." },
        { selector: ".btn.danger", text: "Withdraw a pending application to free one of the 3 pending slots." },
        { selector: "[data-testid=recommendations] .badge.teal", text: "Match score: 50 for course and track fit, 30 for same city, 20 if the placement covers the SIWES length." },
      ],
    },
    {
      id: "apply", title: "Applying for a placement", intro: "On a hub page a signed-in student opens the form under an opening, writes a short note and sends it.",
      run: async (p) => {
        await signIn(p, base, "student");
        await p.goto(`${base}/hubs/futtybills`);
        const o = p.getByTestId("opening").filter({ hasText: "Junior Software Engineer Intern" });
        await o.getByText("Apply for this role").click();
        await o.getByLabel("Why do you want this placement?").fill("I want to learn");
        await o.getByRole("button", { name: "Send application" }).click();
        await o.getByText("Write at least 30 characters").waitFor();
      },
      callouts: [
        { selector: ".opening details summary", text: "Apply for this role opens the form only when every rule passes." },
        { selector: ".opening textarea", text: "Short note to the hub, 30 to 600 characters." },
        { selector: ".opening .field-error", text: "Inline Zod error. The note is kept so the student can fix it." },
      ],
    },
    {
      id: "hub-dash", title: "Hub dashboard", intro: "Signed in as Mfon Udoh of Start Innovation Hub. The hub reviews applications, watches interns progress and posts openings.",
      run: async (p) => { await signIn(p, base, "hub"); },
      callouts: [
        { selector: ".grid-stats", text: "Live openings, pending applications, applications waiting more than 10 days and accepted interns." },
        { selector: "[data-testid=pending-row] .badge.no_response", text: "Flag on an application left unanswered for over 10 days." },
        { selector: "[data-testid=pending-row] .btn.success", text: "Accept or reject. Accepting is refused once the opening is full." },
        { selector: "[data-testid=intern-list] .progress", text: "Intern progress: week number and a bar computed from the start date and length." },
        { selector: "aside form", text: "Post a new opening. Zod checks that the deadline is before the start date and not in the past." },
      ],
    },
    {
      id: "placed", title: "After a hub accepts", intro: "The hub accepted Imaobong for the Frontend Developer role. Her dashboard now shows the placement with a countdown to the start date.",
      run: async (p) => {
        await signIn(p, base, "hub");
        await p.getByRole("button", { name: "Accept Imaobong Udo" }).click();
        await p.getByTestId("intern-list").getByText("Imaobong Udo").waitFor();
        await signIn(p, base, "student");
      },
      callouts: [
        { selector: "[data-testid=placement-card] .badge", text: "Countdown to the start date. During the placement it shows Week N of M." },
        { selector: "[data-testid=placement-card] .progress", text: "Progress bar for the whole placement." },
        { selector: "[data-testid=application-status]", text: "The application is now Accepted. The student cannot apply anywhere else." },
      ],
    },
  ];

  const mobileSteps: Step[] = [
    { id: "m-home", title: "Mobile home", intro: "", mobile: true, run: async (p) => { await p.goto(`${base}/`); }, callouts: [] },
    { id: "m-hub", title: "Mobile hub page", intro: "", mobile: true, run: async (p) => { await p.context().clearCookies(); await p.goto(`${base}/hubs/the-roothub`); }, callouts: [] },
    { id: "m-student", title: "Mobile student dashboard", intro: "", mobile: true, run: async (p) => { await signIn(p, base, "student"); }, callouts: [] },
  ];

  const shots: Shot[] = [];
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5 });
  const mobile = await browser.newContext({ ...devices["Pixel 7"] });
  for (const step of [...steps, ...mobileSteps]) {
    const page = await (step.mobile ? mobile : desktop).newPage();
    await step.run(page);
    await page.waitForLoadState("networkidle");
    // hide the Next.js dev indicator if present
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    if (step.callouts.length) await drawCallouts(page, step.callouts);
    const file = path.join(outDir, `${step.id}.png`);
    await page.screenshot({ path: file, fullPage: !step.mobile });
    shots.push({ id: step.id, title: step.title, intro: step.intro, file, callouts: step.callouts, mobile: step.mobile });
    await page.close();
  }
  await browser.close();
  return shots;
}
