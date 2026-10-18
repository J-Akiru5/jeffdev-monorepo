/**
 * Auth setup project
 * -------------------
 * Signs in once with the E2E account and saves the session (cookies) to
 * e2e/.auth/user.json — every chromium spec reuses it via storageState.
 * When credentials are missing, writes an empty state and skips so the
 * dependent specs skip too.
 */

import { test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const AUTH_FILE = resolve(__dirname, ".auth/user.json");

setup("authenticate as the E2E account", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password || process.env.E2E_READY !== "1") {
    mkdirSync(resolve(__dirname, ".auth"), { recursive: true });
    writeFileSync(
      AUTH_FILE,
      JSON.stringify({ cookies: [], origins: [] }),
      "utf-8",
    );
    setup.skip(true, "E2E account not provisioned");
    return;
  }

  await page.goto("/sign-in");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Click submit; on a cold dev compile the first click can land before
  // hydration — retry once if the URL doesn't change.
  const submit = page.locator('button[type="submit"]');
  await submit.click();
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
      timeout: 15_000,
    });
  } catch {
    await submit.click();
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
      timeout: 30_000,
    });
  }

  // Dismiss the first-run tour so specs don't race with it, then persist the
  // session (cookies + localStorage) for the chromium project.
  await page.goto("/dashboard");
  const dismiss = page.getByRole("button", { name: "Dismiss" });
  try {
    await dismiss.waitFor({ state: "visible", timeout: 10_000 });
    await dismiss.click();
  } catch {
    // Tour already completed or not applicable
  }

  mkdirSync(resolve(__dirname, ".auth"), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
