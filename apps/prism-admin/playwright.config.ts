import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration for prism-admin
 * ----------------------------------------------
 * Tests admin flows: login, dashboard, theme toggle, error boundary.
 * Runs against local dev server on port 3004.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3004",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run local dev server before tests (only if not in CI) */
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm --filter prism-admin dev",
        port: 3004,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
