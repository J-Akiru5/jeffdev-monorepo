/**
 * Playwright Auth Helper for prism-admin
 *
 * Provides real Supabase API-driven login for E2E tests.
 * Uses the test-admin@syntaxure.dev user created by seed-test-user.ts.
 */

import { type Page } from "@playwright/test";

const TEST_USER = {
  email: "test-admin@syntaxure.dev",
  password: "TestAdmin123!@#",
};

/**
 * Login as test admin via Supabase Auth API
 * and set the session cookies in the browser context.
 */
export async function loginAsAdmin(
  page: Page,
  baseURL: string
): Promise<void> {
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";

  // Call Supabase Auth API to get session
  const response = await page.request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      data: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok() || !data.access_token) {
    throw new Error(`Auth failed: ${data.error_description || data.msg || "Unknown error"}`);
  }

  // Set Supabase auth cookies
  const context = page.context();
  await context.addCookies([
    {
      name: "sb-access-token",
      value: data.access_token,
      domain: new URL(baseURL).hostname,
      path: "/",
    },
    {
      name: "sb-refresh-token",
      value: data.refresh_token,
      domain: new URL(baseURL).hostname,
      path: "/",
    },
  ]);

  // Wait for session to be established
  await page.waitForLoadState("networkidle");
}

/**
 * Login and navigate to a specific admin page
 */
export async function loginAndNavigate(
  page: Page,
  baseURL: string,
  path: string
): Promise<void> {
  await loginAsAdmin(page, baseURL);
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
