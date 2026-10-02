// Builds docs/SIWEX-Documentation.pdf and docs/SIWEX-Slides.pdf.
//
//   npm run build            (once, the script serves the production build)
//   npm run docs:build
//
// The script reseeds DATABASE_URL with SIWEX_TODAY=2026-10-02, starts
// `next start` on port 3200, takes screenshots with callouts, then renders
// HTML (fonts and images embedded) to PDF with Chromium.
import "dotenv/config";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createDb } from "../../src/db";
import { clearAll, seed } from "../../src/db/seed-data";
import { docHtml, slidesHtml, type Assets } from "./content";
import { takeShots } from "./shots";

const ROOT = path.resolve(import.meta.dirname, "../..");
const DOCS = path.join(ROOT, "docs");
const SHOTS = path.join(DOCS, "screenshots");
const TODAY = "2026-10-02";
const PORT = 3200;
const BASE = `http://localhost:${PORT}`;

async function reseed() {
  const { db, pool } = createDb(process.env.DATABASE_URL!);
  await clearAll(db);
  await seed(db, TODAY);
  await pool.end();
}

async function waitFor(url: string, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start: ${url}`);
}

function startServer(): ChildProcess {
  return spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, SIWEX_TODAY: TODAY, NODE_ENV: "production" },
    stdio: "ignore",
  });
}

function dataUri(file: string, mime: string) {
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

function fontFaces() {
  const dir = path.join(ROOT, "node_modules/@fontsource/plus-jakarta-sans/files");
  return [400, 600, 700, 800]
    .map((w) => `@font-face{font-family:"Plus Jakarta Sans";font-weight:${w};font-style:normal;src:url(${dataUri(path.join(dir, `plus-jakarta-sans-latin-${w}-normal.woff2`), "font/woff2")}) format("woff2");}`)
    .join("\n");
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, ".next/BUILD_ID"))) throw new Error("Run `npm run build` first");
  fs.mkdirSync(SHOTS, { recursive: true });
  await reseed();
  const server = startServer();
  try {
    await waitFor(`${BASE}/api/health`);
    const shots = await takeShots(BASE, SHOTS);
    const assets: Assets = {
      fonts: fontFaces(),
      logo: dataUri(path.join(ROOT, "public/logo.svg"), "image/svg+xml"),
      hero: dataUri(path.join(ROOT, "public/hero.svg"), "image/svg+xml"),
      shots: Object.fromEntries(shots.map((s) => [s.id, { ...s, src: dataUri(s.file, "image/png") }])),
      publicUrl: process.env.PUBLIC_URL ?? "https://siwex-production.up.railway.app",
    };

    const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
    const page = await browser.newPage();

    await page.setContent(docHtml(assets), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: path.join(DOCS, "SIWEX-Documentation.pdf"),
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="width:100%;font-size:8px;color:#888;padding:0 14mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>SIWEX Documentation</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    });

    await page.setContent(slidesHtml(assets), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(DOCS, "SIWEX-Slides.pdf"), width: "1280px", height: "720px", printBackground: true });

    await browser.close();
    console.log("Wrote docs/SIWEX-Documentation.pdf and docs/SIWEX-Slides.pdf");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
