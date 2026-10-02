// HTML for the documentation PDF and the slide deck. Plain ASCII only:
// no em dashes, en dashes, curly quotes or emojis.
import type { Shot } from "./shots";

export interface Assets {
  fonts: string;
  logo: string;
  hero: string;
  shots: Record<string, Shot & { src: string }>;
  publicUrl: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const baseCss = `
:root{--purple:#7d2ae8;--teal:#00c4cc;--ink:#1b1340;--muted:#5f5a78;--line:#e7e3f2;--soft:#f6f2ff}
*{box-sizing:border-box}
body{margin:0;font-family:"Plus Jakarta Sans",sans-serif;color:var(--ink);font-size:10.5pt;line-height:1.55}
h1,h2,h3{letter-spacing:-.01em;line-height:1.25}
code,pre{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:9pt}
pre{background:#f4f2fa;border-radius:8px;padding:10px 12px;white-space:pre-wrap;margin:6px 0 10px}
code{background:#f4f2fa;border-radius:4px;padding:1px 4px}
table{border-collapse:collapse;width:100%;margin:8px 0 12px;font-size:9.5pt}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--soft)}
`;

function shotBlock(s: Shot & { src: string }, n: string) {
  return `
  <section class="shot">
    <h3>${n} ${esc(s.title)}</h3>
    <p>${esc(s.intro)}</p>
    <img src="${s.src}" alt="${esc(s.title)}"/>
    ${s.callouts.length ? `<ol class="callouts">${s.callouts.map((c) => `<li>${esc(c.text)}</li>`).join("")}</ol>` : ""}
  </section>`;
}

export function docHtml(a: Assets): string {
  const s = a.shots;
  const walk = ["home", "hubs", "hub-detail", "sign-in", "sign-up", "student", "apply", "hub-dash", "placed"];
  return `<!doctype html><html><head><meta charset="utf-8"><title>SIWEX Documentation</title><style>
${a.fonts}
${baseCss}
h1{font-size:24pt;margin:0 0 6px}
h2{font-size:16pt;color:var(--purple);margin:22px 0 8px;padding-bottom:4px;border-bottom:2px solid var(--line)}
h3{font-size:12pt;margin:14px 0 6px}
.cover{height:255mm;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(130deg,#00c4cc,#5a32fa 55%,#7d2ae8);color:#fff;border-radius:18px;padding:22mm 16mm;page-break-after:always}
.cover .logo{background:#fff;border-radius:14px;padding:8px 14px;width:max-content}
.cover .logo img{height:44px}
.cover h1{font-size:34pt;line-height:1.1;margin:18px 0 10px}
.cover p{font-size:13pt;opacity:.95;max-width:30em}
.cover .hero{width:65%;align-self:flex-end}
.cover .meta{font-size:10pt;opacity:.9}
.toc li{margin:3px 0}
.page{page-break-before:always}
.shot{page-break-inside:avoid;margin-bottom:14px}
.shot img{display:block;max-width:100%;max-height:205mm;margin:0 auto;border:1px solid var(--line);border-radius:10px}
.callouts{margin:8px 0 0;padding-left:0;list-style:none;counter-reset:c}
.callouts li{counter-increment:c;position:relative;padding-left:30px;margin:5px 0}
.callouts li::before{content:counter(c);position:absolute;left:0;top:1px;width:20px;height:20px;border-radius:50%;background:#ff3d7f;color:#fff;font-weight:800;font-size:9pt;display:grid;place-items:center}
.mobile-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:8px}
.mobile-row figure{margin:0;text-align:center;font-size:9pt;color:var(--muted)}
.mobile-row img{width:100%;border:1px solid var(--line);border-radius:14px}
.arch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0}
.box{border:2px solid var(--purple);border-radius:12px;padding:10px;background:var(--soft)}
.box.teal{border-color:var(--teal);background:#e6fafb}
.box b{display:block;margin-bottom:4px}
.box ul{margin:0;padding-left:16px;font-size:9pt}
.note{background:#fff3df;border-radius:10px;padding:8px 12px;font-size:9.5pt}
.script td:first-child{white-space:nowrap;font-weight:700;width:70px}
</style></head><body>

<div class="cover">
  <div>
    <div class="logo"><img src="${a.logo}" alt="SIWEX"/></div>
    <h1>SIWEX<br/>SIWES placement finder</h1>
    <p>A web app that helps Nigerian students find SIWES placements in tech hubs, and helps hubs pick and track their interns.</p>
  </div>
  <img class="hero" src="${a.hero}" alt=""/>
  <div class="meta">300 level project documentation<br/>Live app: ${esc(a.publicUrl)}<br/>Demo student: imaobong@siwex.ng / demo1234. Demo hub: start@siwex.ng / demo1234</div>
</div>

<h2 style="margin-top:0">Contents</h2>
<ol class="toc">
  <li>Overview</li><li>How the core logic works</li><li>Architecture and data model</li><li>Walkthrough of every screen</li>
  <li>Mobile view</li><li>Running locally</li><li>Testing</li><li>Deployment</li><li>Five minute presentation script</li><li>Decisions and limits</li>
</ol>

<h2>1. Overview</h2>
<p>Every Nigerian university student in a technical course must do SIWES (Students Industrial Work Experience Scheme), usually 12 or 24 weeks. Finding a placement is mostly word of mouth: students walk from office to office with letters, and hubs get applications they cannot track.</p>
<p>SIWEX puts the tech hubs of Uyo, and a few beyond, in one directory. Students filter hubs by city and track, see which roles still have slots, apply with a short note and follow every reply on one dashboard. Hubs post openings, accept or reject applicants, and watch their interns progress week by week.</p>
<h3>Users and roles</h3>
<table><tr><th>Role</th><th>Can do</th></tr>
<tr><td>Visitor</td><td>Browse and search hubs and openings.</td></tr>
<tr><td>Student</td><td>Register with school, course, level, city and SIWES length. Apply, withdraw, see recommendations and placement progress.</td></tr>
<tr><td>Hub</td><td>Register a hub profile. Post openings, accept or reject applications, see interns and their progress.</td></tr></table>
<h3>Hubs in the demo data</h3>
<table><tr><th>Hub</th><th>City</th><th>Address</th><th>Source</th></tr>
<tr><td>Start Innovation Hub</td><td>Uyo</td><td>Plot 6, Unit C, Ewet Housing Estate</td><td>Verified on starthub.com.ng</td></tr>
<tr><td>The RootHub</td><td>Uyo</td><td>AKEES Plaza, opposite Ibom Hall, IBB Avenue</td><td>Verified on public business listings</td></tr>
<tr><td>Futtybills</td><td>Uyo</td><td>Nwaniba Road (to be confirmed)</td><td>Named in the brief. No public listing found, so the address is marked unconfirmed</td></tr>
<tr><td>Square One</td><td>Uyo</td><td>Oron Road (to be confirmed)</td><td>Named in the brief. No public listing found, so the address is marked unconfirmed</td></tr>
<tr><td>Chainspace HQ</td><td>Uyo</td><td>Udo Udoma Avenue (to be confirmed)</td><td>Found as an Uyo co-working space; street not confirmed</td></tr>
<tr><td>Co-Creation Hub</td><td>Lagos</td><td>294 Herbert Macaulay Way, Yaba</td><td>Verified, public address</td></tr></table>
<p class="note">Openings, stipends, students and applications are sample data for the demo. They are not real offers from these hubs.</p>

<h2 class="page">2. How the core logic works</h2>
<p>All business rules live in <code>src/lib/rules.ts</code> as pure functions. None of them reads the clock or the database: the caller passes "today" as a <code>YYYY-MM-DD</code> string. In the app, today comes from <code>getToday()</code>, which returns <code>SIWEX_TODAY</code> when it is set and otherwise the current date in Lagos. This makes the demo and the tests repeatable.</p>
<h3>Opening status</h3>
<table><tr><th>Status</th><th>Rule</th></tr>
<tr><td>Closed</td><td>Today is after the deadline. Checked first, so a closed opening with free slots still shows Closed.</td></tr>
<tr><td>Full</td><td>Accepted applications equal the number of slots.</td></tr>
<tr><td>Closing soon</td><td>7 days or less to the deadline (the deadline day counts as open).</td></tr>
<tr><td>Open</td><td>Everything else.</td></tr></table>
<h3>Can a student apply? (checkCanApply)</h3>
<p>The checks run in this order and the first failure is shown to the student in plain words:</p>
<ol><li>The opening is not closed.</li><li>The opening is not full.</li><li>The student has not already applied to it (a withdrawn application can be sent again).</li><li>The student does not already have an accepted placement.</li><li>The student has fewer than 3 pending applications, so nobody hoards slots.</li><li>The placement is at least as long as the student's SIWES (a 12 week opening cannot satisfy a 24 week SIWES).</li></ol>
<h3>Other rules</h3>
<table><tr><th>Function</th><th>What it does</th></tr>
<tr><td>applicationDisplay</td><td>A pending application older than 10 days shows as "No response yet" to both sides.</td></tr>
<tr><td>checkCanDecide</td><td>A hub can only decide pending applications, and cannot accept once the opening is full.</td></tr>
<tr><td>placementProgress</td><td>From start date and length: not started (with days to go), in progress (week N of M and percent), or completed.</td></tr>
<tr><td>matchScore</td><td>0 to 100. 50 if the track is the top fit for the course (35 for another good fit), 30 for the same city, 20 if the placement covers the SIWES length. Used to rank recommendations and shown to hubs.</td></tr></table>
<p>The same rules run twice: once to decide what the page shows (for example, hide the apply form and explain why), and again inside the Server Action before anything is written, so a stale page cannot break a rule.</p>

<h2 class="page">3. Architecture and data model</h2>
<div class="arch">
  <div class="box"><b>Browser</b><ul><li>Server rendered pages</li><li>Small client forms using useActionState</li><li>HTTP-only session cookie</li></ul></div>
  <div class="box"><b>Next.js 16 (App Router)</b><ul><li>Server Components read data</li><li>Server Actions write data</li><li>proxy.ts guards /student and /hub</li><li>/api/health pings the database</li></ul></div>
  <div class="box teal"><b>PostgreSQL</b><ul><li>Drizzle ORM queries</li><li>drizzle-kit SQL migrations in /drizzle</li><li>Hosted on Railway</li></ul></div>
</div>
<table><tr><th>Folder</th><th>Contents</th></tr>
<tr><td><code>src/lib/rules.ts</code></td><td>Pure business rules (status, apply checks, progress, match score).</td></tr>
<tr><td><code>src/lib/dates.ts</code></td><td>Date helpers and getToday with SIWEX_TODAY support.</td></tr>
<tr><td><code>src/lib/data.ts</code></td><td>All database reads and writes. Every user query is filtered by the signed-in user id.</td></tr>
<tr><td><code>src/lib/validation.ts</code></td><td>Zod schemas for every form and a helper that turns issues into field errors.</td></tr>
<tr><td><code>src/lib/session.ts, auth.ts</code></td><td>JWT signing with jose, cookie handling, role guard.</td></tr>
<tr><td><code>src/app</code></td><td>Pages, Server Actions (actions.ts) and the health route.</td></tr>
<tr><td><code>src/db</code></td><td>Drizzle schema, connection and demo seed data.</td></tr></table>
<h3>Tables</h3>
<table><tr><th>Table</th><th>Key columns</th><th>Notes</th></tr>
<tr><td>users</td><td>id, email (unique), password_hash, name, role</td><td>role is student or hub. Passwords hashed with bcryptjs.</td></tr>
<tr><td>students</td><td>user_id (PK, FK users), school, course, level, city, required_weeks</td><td>One row per student user.</td></tr>
<tr><td>hubs</td><td>id, owner_user_id (unique FK), slug, name, city, state, address, address_verified, about, tracks[], color</td><td>One hub per hub user.</td></tr>
<tr><td>openings</td><td>id, hub_id, title, track, slots, duration_weeks, start_date, deadline, stipend_naira</td><td>Status is computed, never stored.</td></tr>
<tr><td>applications</td><td>id, opening_id, student_user_id, status, note, applied_on, decided_on</td><td>Unique on (opening_id, student_user_id). Status: pending, accepted, rejected, withdrawn.</td></tr></table>
<h3>Security</h3>
<ul><li>Sessions are HS256 JWTs signed with SESSION_SECRET, stored in an HTTP-only, SameSite=Lax cookie (Secure in production) for 7 days.</li>
<li>proxy.ts redirects signed-out visitors away from dashboards; each page and action checks the role again.</li>
<li>Hub actions join through hubs.owner_user_id, so a hub can never decide another hub's applications. Students can only withdraw their own.</li></ul>

<h2 class="page">4. Walkthrough of every screen</h2>
<p>Screenshots were taken with Playwright against the demo data with SIWEX_TODAY=2026-10-02. Numbers on each image match the notes below it.</p>
${walk.map((id, i) => shotBlock(s[id], `4.${i + 1}`)).join("\n")}

<h2 class="page">5. Mobile view</h2>
<p>The layout is a single column under 760px wide. Grids use <code>minmax(0, 1fr)</code> so long text and lists never push the page sideways, and the header hides secondary links. A Playwright test on a Pixel 7 viewport checks that the page has no horizontal scroll.</p>
<div class="mobile-row">
  <figure><img src="${s["m-home"].src}"/><figcaption>Home</figcaption></figure>
  <figure><img src="${s["m-hub"].src}"/><figcaption>Hub page</figcaption></figure>
  <figure><img src="${s["m-student"].src}"/><figcaption>Student dashboard with placement</figcaption></figure>
</div>

<h2 class="page">6. Running locally</h2>
<pre>service postgresql start
sudo -u postgres createdb siwex
sudo -u postgres createdb siwex_test
cp .env.example .env          # edit DATABASE_URL if needed
npm install
npm run db:migrate
npm run db:seed               # wipes and reseeds demo data
npm run dev                   # http://localhost:3000</pre>
<table><tr><th>Variable</th><th>Purpose</th></tr>
<tr><td>DATABASE_URL</td><td>Postgres connection string for the app.</td></tr>
<tr><td>TEST_DATABASE_URL</td><td>Separate database used by integration and e2e tests.</td></tr>
<tr><td>SESSION_SECRET</td><td>Secret for signing session tokens (16+ characters, required in production).</td></tr>
<tr><td>SIWEX_TODAY</td><td>Optional YYYY-MM-DD date that pins "today" for demos and tests.</td></tr></table>
<table><tr><th>Script</th><th>What it does</th></tr>
<tr><td>npm run dev / build / start</td><td>Next.js development, production build, production server.</td></tr>
<tr><td>npm run db:generate</td><td>Create a new SQL migration from schema changes.</td></tr>
<tr><td>npm run db:migrate</td><td>Apply migrations.</td></tr>
<tr><td>npm run db:seed / db:seed:if-empty</td><td>Reseed demo data / seed only an empty database.</td></tr>
<tr><td>npm test</td><td>Vitest unit and integration tests.</td></tr>
<tr><td>npm run test:e2e</td><td>Playwright end-to-end tests on desktop and mobile.</td></tr>
<tr><td>npm run docs:build</td><td>Rebuild this PDF and the slide deck (run npm run build first).</td></tr></table>

<h2>7. Testing</h2>
<table><tr><th>Suite</th><th>Tool</th><th>Tests</th><th>Covers</th></tr>
<tr><td>Unit</td><td>Vitest</td><td>41</td><td>Dates and SIWEX_TODAY, every rule in rules.ts, Zod schemas, JWT sign and verify.</td></tr>
<tr><td>Integration</td><td>Vitest + real Postgres (siwex_test)</td><td>18</td><td>Search and filters, sign up and login, apply limits, withdraw scoping, recommendations, hub decisions, cross-hub access is refused, opening creation.</td></tr>
<tr><td>End to end</td><td>Playwright, production build</td><td>17 (14 desktop, 3 mobile)</td><td>Home, directory filters, demo login pre-fill, inline validation, apply flow, accept and reject, posting an opening, auth redirects, health check, no sideways scroll on mobile.</td></tr></table>
<p>All 76 tests pass. Integration and e2e tests reseed the test database before each test, with today fixed at 2026-10-02.</p>
<pre>npm test           # 59 passed (41 unit + 18 integration)
npm run test:e2e   # 17 passed</pre>

<h2>8. Deployment</h2>
<p>The app runs on Railway in the project "school-projects", connected to the GitHub repository so every push redeploys.</p>
<ol><li>A PostgreSQL service is provisioned in the project.</li>
<li>The app service has <code>DATABASE_URL=\${{Postgres.DATABASE_URL}}</code>, a random <code>SESSION_SECRET</code> and <code>NODE_ENV=production</code>.</li>
<li><code>railway.json</code> builds with <code>npm run build</code>. The start command runs migrations, seeds demo data only if the database is empty, then runs <code>next start -H 0.0.0.0</code>.</li>
<li>Railway calls <code>/api/health</code>, which runs <code>select 1</code> against the database, before switching traffic to a new deployment.</li></ol>
<p>Live URL: <b>${esc(a.publicUrl)}</b></p>

<h2 class="page">9. Five minute presentation script</h2>
<table class="script">
<tr><th>Time</th><th>Say and do</th></tr>
<tr><td>0:00-0:30</td><td>Problem. "Every one of us needs a SIWES placement. Today it is letters and word of mouth, and hubs lose track of applications." Show the home page.</td></tr>
<tr><td>0:30-1:15</td><td>Directory. Click Hubs. Filter by Uyo, then by Software Development. Point at the slots left badge and the verified address tick. Open Start Innovation Hub and show Closing soon, Open and Closed badges.</td></tr>
<tr><td>1:15-2:15</td><td>Student. Click Sign in; the demo login is already filled. On the dashboard point at the "no reply for over 10 days" warning and the match scores. Open Futtybills, apply with a too-short note to show the inline error, then a proper note. Show it on the dashboard and that the pending cap now blocks a fourth application.</td></tr>
<tr><td>2:15-3:15</td><td>Hub. Sign out, choose Hub demo, sign in. Walk the four stat cards. Accept Imaobong. Point at the interns list and progress bars. Post a new opening, show the deadline rule error, then publish.</td></tr>
<tr><td>3:15-3:45</td><td>Back to the student. Sign in as Imaobong again and show the placement card counting down to the start date.</td></tr>
<tr><td>3:45-4:30</td><td>How it works. Show the architecture slide: Next.js Server Components and Server Actions, Drizzle and Postgres on Railway, rules as pure functions with a pinned "today", 76 automated tests.</td></tr>
<tr><td>4:30-5:00</td><td>Wrap up. Phone view of the site, what we would add next (logbook upload, school supervisor sign-off, hub verification), then questions.</td></tr></table>

<h2>10. Decisions and limits</h2>
<ul>
<li>Futtybills and Square One were named in the brief but have no public listing that we could find, so their street addresses are placeholders and marked "Address to be confirmed" in the app.</li>
<li>A student can hold at most 3 pending applications and only one accepted placement. A pending application is flagged after 10 days. Openings are "closing soon" from 7 days before the deadline.</li>
<li>SIWES length is 12 or 24 weeks. A placement shorter than the student's SIWES is blocked.</li>
<li>Stipends are monthly, in naira, shown as "NGN 30,000 / month"; 0 means unpaid.</li>
<li>Hub logos are coloured initials and avatars are generated locally with DiceBear, so the site makes no image requests to outside servers.</li>
<li>Not built: password reset, email notifications, file uploads (CV, logbook) and admin verification of hubs.</li>
</ul>
</body></html>`;
}

export function slidesHtml(a: Assets): string {
  const s = a.shots;
  const slide = (inner: string, cls = "") => `<section class="slide ${cls}">${inner}</section>`;
  const slides = [
    slide(`<div class="title-wrap"><div><div class="logo"><img src="${a.logo}"/></div><h1>Find your SIWES placement in a tech hub near you</h1><p>SIWEX: a placement finder for students and tech hubs in Uyo and across Nigeria</p><p class="small">300 level project presentation</p></div><img class="hero" src="${a.hero}"/></div>`, "grad"),
    slide(`<h2>The problem</h2><div class="cols"><ul class="big"><li>Every technical student must do 12 or 24 weeks of SIWES</li><li>Placements are found by word of mouth and printed letters</li><li>Students do not know which hubs still have space</li><li>Hubs get applications by email and WhatsApp and lose track</li></ul><div class="stat-col"><div class="stat"><b>4</b><span>Uyo hubs from the brief</span></div><div class="stat"><b>1</b><span>place to apply and track</span></div></div></div>`),
    slide(`<h2>What SIWEX does</h2><div class="cols3"><div class="card"><h3>Find</h3><p>Directory of hubs with filters for city and track. Each role shows slots left, stipend, length and deadline.</p></div><div class="card"><h3>Apply</h3><p>One short note. The app checks deadline, slots, the pending limit and SIWES length before it lets you apply.</p></div><div class="card"><h3>Get placed</h3><p>Hubs accept or reject from a dashboard. Students see their placement week by week.</p></div></div>`),
    slide(`<h2>The hubs</h2><div class="hubs"><div><b>Start Innovation Hub</b><span>Ewet Housing Estate, Uyo</span></div><div><b>The RootHub</b><span>IBB Avenue, Uyo</span></div><div><b>Futtybills</b><span>Uyo</span></div><div><b>Square One</b><span>Uyo</span></div><div><b>Chainspace HQ</b><span>Uyo</span></div><div><b>Co-Creation Hub</b><span>Yaba, Lagos</span></div></div><p class="small muted">Openings and students are sample data. Addresses that could not be confirmed are labelled in the app.</p>`),
    slide(`<h2>Student view</h2><div class="shotwrap"><img src="${s.student.src}"/></div>`),
    slide(`<h2>Hub view</h2><div class="shotwrap"><img src="${s["hub-dash"].src}"/></div>`),
    slide(`<h2>The rules</h2><table><tr><th>Rule</th><th>Value</th></tr><tr><td>Closing soon</td><td>7 days or less to the deadline</td></tr><tr><td>Pending limit</td><td>3 applications per student</td></tr><tr><td>One placement</td><td>No new applications after an acceptance</td></tr><tr><td>SIWES length</td><td>Placement must be at least as long</td></tr><tr><td>No response flag</td><td>Pending for more than 10 days</td></tr><tr><td>Match score</td><td>Track 50 + city 30 + length 20</td></tr></table><p class="small muted">Pure functions that take "today" as input. SIWEX_TODAY pins the date for demos and tests.</p>`),
    slide(`<h2>How it is built</h2><div class="cols3"><div class="card"><h3>Next.js 16</h3><p>App Router, Server Components for pages, Server Actions for forms, Zod validation with inline errors.</p></div><div class="card"><h3>PostgreSQL</h3><p>Drizzle ORM with versioned SQL migrations. Every query scoped to the signed-in user.</p></div><div class="card"><h3>Auth</h3><p>bcrypt password hashes. Signed JWT in an HTTP-only cookie. proxy.ts guards dashboards.</p></div></div>`),
    slide(`<h2>Tested and deployed</h2><div class="cols"><div class="stat-col"><div class="stat"><b>41</b><span>unit tests</span></div><div class="stat"><b>18</b><span>integration tests on real Postgres</span></div><div class="stat"><b>17</b><span>Playwright tests, desktop and mobile</span></div></div><div><img class="phone" src="${s["m-student"].src}"/></div></div><p>Live on Railway: <b>${esc(a.publicUrl)}</b></p>`),
    slide(`<div class="title-wrap"><div><h1>Thank you</h1><p>Try it: ${esc(a.publicUrl)}</p><p>Student: imaobong@siwex.ng / demo1234<br/>Hub: start@siwex.ng / demo1234</p><p class="small">Next: logbook upload, supervisor sign-off, hub verification</p></div><img class="hero" src="${a.hero}"/></div>`, "grad"),
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><title>SIWEX Slides</title><style>
${a.fonts}
${baseCss}
@page{size:1280px 720px;margin:0}
body{font-size:20px}
.slide{width:1280px;height:720px;padding:56px 72px;page-break-after:always;overflow:hidden;position:relative;background:#f7f5fc;display:flex;flex-direction:column;justify-content:center}
.slide::after{content:"";position:absolute;left:0;bottom:0;height:10px;width:100%;background:linear-gradient(90deg,#00c4cc,#7d2ae8)}
.slide.grad{background:linear-gradient(130deg,#00c4cc,#5a32fa 55%,#7d2ae8);color:#fff}
.slide.grad::after{display:none}
h1{font-size:54px;margin:18px 0 12px;line-height:1.08}
h2{font-size:44px;margin:0 0 32px;color:var(--purple)}
h3{font-size:26px;margin:0 0 8px;color:var(--purple)}
.title-wrap{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:32px;align-items:center}
.title-wrap p{font-size:24px;opacity:.95}
.hero{width:100%}
.logo{background:#fff;border-radius:16px;padding:10px 16px;width:max-content}
.logo img{height:48px}
.small{font-size:18px}.muted{color:var(--muted)}
.cols{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:40px;align-items:center}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.card{background:#fff;border-radius:20px;padding:28px;box-shadow:0 8px 24px rgba(27,19,64,.08)}
.card p{font-size:24px;margin:0;line-height:1.45}
ul.big{font-size:30px;line-height:1.5;padding-left:28px}
.stat-col{display:flex;flex-direction:column;gap:16px}
.stat{background:#fff;border-radius:20px;padding:18px 24px;box-shadow:0 8px 24px rgba(27,19,64,.08)}
.stat b{font-size:52px;color:var(--purple);display:block;line-height:1}
.stat span{color:var(--muted)}
.hubs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.hubs div{background:#fff;border-radius:18px;padding:22px;box-shadow:0 8px 24px rgba(27,19,64,.08)}
.hubs b{display:block;font-size:28px}.hubs span{color:var(--muted);font-size:22px}
.hubs div{padding:32px 26px}
.shotwrap{height:560px;overflow:hidden;border-radius:16px;border:1px solid var(--line);box-shadow:0 8px 24px rgba(27,19,64,.1)}
.shotwrap img{width:100%}
table{font-size:26px}
.phone{height:470px;border-radius:24px;border:1px solid var(--line);margin:0 auto;box-shadow:0 8px 24px rgba(27,19,64,.15)}
</style></head><body>${slides.join("")}</body></html>`;
}
