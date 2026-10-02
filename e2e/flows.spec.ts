import { expect, test } from "@playwright/test";
import { reseed, signIn } from "./helpers";

test.beforeEach(async () => {
  await reseed();
});

test("sign-in page has the demo login filled in", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toHaveValue("imaobong@siwex.ng");
  await expect(page.getByLabel("Password")).toHaveValue("demo1234");
  await page.getByRole("tab", { name: "Hub demo" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("start@siwex.ng");
});

test("student applies to a placement @mobile", async ({ page }) => {
  await signIn(page, "student");
  await expect(page.getByTestId("application-row")).toHaveCount(3);
  await expect(page.getByTestId("stale-alert")).toBeVisible();

  await page.goto("/hubs/futtybills");
  const opening = page.getByTestId("opening").filter({ hasText: "Junior Software Engineer Intern" });
  await opening.getByText("Apply for this role").click();
  await opening.getByLabel("Why do you want this placement?").fill("too short");
  await opening.getByRole("button", { name: "Send application" }).click();
  await expect(opening.getByText("Write at least 30 characters")).toBeVisible();

  await opening.getByLabel("Why do you want this placement?").fill("I build React apps in school and want to work on real payment products.");
  await opening.getByRole("button", { name: "Send application" }).click();
  await expect(opening.getByTestId("applied")).toBeVisible();

  // the pending cap (3) now blocks the next role
  const other = page.getByTestId("opening").filter({ hasText: "Data Analyst Intern" });
  await expect(other.getByTestId("apply-blocked")).toContainText("at most 3 pending");

  await page.goto("/student");
  await expect(page.getByTestId("application-row")).toHaveCount(4);
  await expect(page.getByTestId("my-applications")).toContainText("Junior Software Engineer Intern");
});

test("withdrawing frees a pending slot", async ({ page }) => {
  await signIn(page, "student");
  // withdraw one so the pending cap is not the reason
  await page.getByRole("button", { name: "Withdraw" }).first().click();
  await expect(page.getByTestId("application-status").first()).toHaveText("Withdrawn");
  await page.goto("/hubs/square-one");
  await expect(page.getByTestId("opening").filter({ hasText: "Data Analysis Intern" }).getByText("Apply for this role")).toBeVisible();
});

test("hub accepts a student and the student sees the placement", async ({ page, context }) => {
  await signIn(page, "hub");
  await expect(page.getByTestId("stat-pending")).toHaveText("4");
  await expect(page.getByTestId("stat-needs")).toHaveText("1");
  await page.getByRole("button", { name: "Accept Imaobong Udo" }).click();
  await expect(page.getByTestId("stat-pending")).toHaveText("3");
  await expect(page.getByTestId("stat-interns")).toHaveText("3");
  await expect(page.getByTestId("intern-list")).toContainText("Imaobong Udo");

  await context.clearCookies();
  await signIn(page, "student");
  await expect(page.getByTestId("placement-card")).toContainText("Frontend Developer Intern (React)");
  await expect(page.getByTestId("placement-card")).toContainText("Starts in 30 days");
});

test("hub rejects an application", async ({ page }) => {
  await signIn(page, "hub");
  await page.getByRole("button", { name: "Reject Chiamaka Obi" }).click();
  await expect(page.getByTestId("pending-list")).not.toContainText("Chiamaka Obi");
  await expect(page.getByTestId("stat-pending")).toHaveText("3");
});

test("hub posts a new opening with validation", async ({ page }) => {
  await signIn(page, "hub");
  await page.getByRole("button", { name: "Publish opening" }).click();
  await expect(page.getByText("Enter a title of at least 5 characters")).toBeVisible();
  await expect(page.getByText("Pick a track")).toBeVisible();

  await page.getByLabel("Role title").fill("Mobile Developer Intern");
  await page.getByLabel("Track").selectOption("software");
  await page.getByLabel("Monthly stipend (NGN, 0 if unpaid)").fill("27500");
  await page.getByLabel("What will the intern do?").fill("Build Flutter screens with the mobile team and write widget tests.");
  await page.getByRole("button", { name: "Publish opening" }).click();
  await expect(page.getByText("Opening published")).toBeVisible();
  await expect(page.getByTestId("hub-openings")).toContainText("Mobile Developer Intern");
  await expect(page.getByTestId("stat-live")).toHaveText("3");

  await page.goto("/hubs/start-innovation-hub");
  await expect(page.getByText("NGN 27,500 / month")).toBeVisible();
});
