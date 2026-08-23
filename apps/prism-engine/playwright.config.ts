import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration for prism-engine
 * ----------------------------------------------
 * Covers the Cosmos DB -> Postgres/Supabase migration smoke path: sign in,
 * create a project, create a rule, read it back via the dashboard + REST
 * API, call the MCP JSON-RPC endpoint, and verify the PayPal webhook's
 * signature/idempotency handling.
 *
 * This is meant to run against a REAL environment with real Supabase data —
 * there is no local Postgres/Cosmos stub. Point it at your environment via
 * env vars (see apps/prism-engine/e2e/README.md):
 *
 *   E2E_BASE_URL      Base URL to test against (default: http://localhost:3001)
 *   E2E_TEST_EMAIL     Email of a real (ideally disposable/test) Supabase user
 *   E2E_TEST_PASSWORD  Password for that user
 *
 * Tests that need an authenticated session skip themselves with a clear
 * message if E2E_TEST_EMAIL/E2E_TEST_PASSWORD aren't set, rather than
 * failing confusingly.
 */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";
const isLocalTarget = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share one created project/rule in sequence
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  timeout: 60_000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Only spin up a local dev server if you're actually pointing at localhost
   * and didn't already start one yourself. Against a real deployed/staging
   * URL this is skipped entirely — the whole point is to test real data. */
  webServer:
    process.env.CI || !isLocalTarget
      ? undefined
      : {
          command: "pnpm --filter prism-engine dev",
          port: 3001,
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
});
