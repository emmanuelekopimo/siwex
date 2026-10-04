import { expect, test } from "@playwright/test";
import { reseed } from "./helpers";

test.beforeEach(async () => {
  await reseed();
});

test("home page shows stats and featured hubs @mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("SIWES placement");
  await expect(page.getByTestId("stat-hubs")).toHaveText("17");
  await expect(page.getByTestId("hub-card")).toHaveCount(6);
  await expect(page.getByTestId("track-tile")).toHaveCount(7);
  await expect(page.getByTestId("city-card").first()).toContainText("Uyo");
  // no sideways scrolling on any viewport
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("hub directory lists the Uyo hubs and filters @mobile", async ({ page }) => {
  await page.goto("/hubs");
  for (const name of ["Futtybills", "Start Innovation Hub", "The RootHub", "Square One"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await page.getByLabel("City").selectOption("Lagos");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.getByTestId("result-count")).toHaveText("2 hubs found");
  await expect(page.getByTestId("hub-card").first()).toContainText("Co-Creation Hub");
  await page.getByRole("link", { name: "Calabar", exact: true }).first().click();
  await expect(page.getByTestId("result-count")).toHaveText("2 hubs found");
});

test("search openings from the home page @mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Search openings").fill("flutter");
  await page.getByRole("button", { name: "Search openings" }).click();
  await expect(page).toHaveURL(/\/openings\?q=flutter/);
  await expect(page.getByTestId("opening-row")).toHaveCount(1);
  await expect(page.getByTestId("opening-row")).toContainText("KodeHauz");
});

test("openings page filters by track and can include closed roles", async ({ page }) => {
  await page.goto("/openings");
  const live = Number((await page.getByTestId("opening-count").textContent())!.split(" ")[0]);
  expect(live).toBeGreaterThan(25);
  await page.locator(".chip-row").getByRole("link", { name: "Hardware and IoT" }).click();
  await expect(page).toHaveURL(/track=hardware/);
  await expect(page.getByTestId("opening-count")).toHaveText("4 openings");
  await page.getByRole("link", { name: "Include closed and full" }).click();
  const withClosed = Number((await page.getByTestId("opening-count").textContent())!.split(" ")[0]);
  expect(withClosed).toBeGreaterThanOrEqual(4);
});

test("hub page shows opening states and asks visitors to sign in", async ({ page }) => {
  await page.goto("/hubs/start-innovation-hub");
  const statuses = page.getByTestId("opening-status");
  await expect(statuses).toHaveText(["Closing soon", "Open", "Closed"]);
  await expect(page.getByRole("link", { name: "Sign in as a student to apply" }).first()).toBeVisible();
  await expect(page.getByText("Address verified")).toBeVisible();
});

test("dashboards redirect signed-out visitors to sign in", async ({ page }) => {
  await page.goto("/student");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fstudent/);
  await page.goto("/hub");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fhub/);
});

test("health check pings the database", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ status: "ok", database: "ok", today: "2026-10-02" });
});

test("sign up shows inline errors, then creates a student", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Pick your course")).toBeVisible();

  await page.getByLabel("Full name").fill("Edidiong Sam");
  await page.getByLabel("Email").fill("edidiong@example.com");
  await page.getByLabel("Password").fill("password1");
  await page.getByLabel("School").fill("University of Uyo");
  await page.getByLabel("Course").selectOption("Statistics");
  await page.getByLabel("Level").selectOption("300");
  await page.getByLabel("City").selectOption("Uyo");
  await page.getByLabel("SIWES length").selectOption("24");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/student");
  await expect(page.getByRole("heading", { name: "Hello, Edidiong" })).toBeVisible();
  await expect(page.getByTestId("recommendations")).toContainText("Data Analyst Intern");
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".alert.error")).toHaveText("Wrong email or password");
});
