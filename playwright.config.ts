import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_TODAY = "2026-10-02";
const executablePath = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { executablePath } }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
      SIWEX_TODAY: E2E_TODAY,
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret",
    },
  },
});
