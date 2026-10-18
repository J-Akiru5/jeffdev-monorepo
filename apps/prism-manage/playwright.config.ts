import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Playwright E2E Configuration
 * -----------------------------
 * Real end-to-end tests against a running prism-manage instance.
 *  - Loads .env.local + .env.e2e.local into the test process (Next only
 *    auto-loads these for the server, not for Playwright itself)
 *  - globalSetup provisions the dedicated E2E account (idempotent)
 *  - globalTeardown cleans up `e2e-*` test data
 *  - auth.setup signs in once; specs reuse the session via storageState
 *  - CI runs against the production build (`pnpm run start`); locally the
 *    dev server starts automatically
 */

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  try {
    for (const line of readFileSync(filePath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // best-effort
  }
}

loadEnvFile(resolve(__dirname, ".env.local"));
loadEnvFile(resolve(__dirname, ".env.e2e.local"));

export const AUTH_STATE = resolve(__dirname, "e2e/.auth/user.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? "github" : "html",
  timeout: 60_000,
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3007",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    /* Signs in once and saves the session */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE },
      dependencies: ["setup"],
    },
  ],

  /* Production build in CI (built by the workflow), dev server locally */
  webServer: {
    command: process.env.CI ? "pnpm run start" : "pnpm run dev",
    url: "http://localhost:3007",
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
