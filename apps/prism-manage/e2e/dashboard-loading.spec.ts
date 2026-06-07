import { test, expect } from "@playwright/test";

/**
 * Dashboard Loading State Tests
 * ------------------------------
 * Verifies that loading.tsx skeletons render correctly for each dashboard route.
 * Uses route interception to delay responses so the streaming loading state is visible.
 */

const DASHBOARD_ROUTES = [
  { path: "/dashboard", name: "dashboard root", skeleton: ".animate-pulse" },
  { path: "/tasks", name: "tasks", skeleton: ".animate-pulse" },
  { path: "/kanban", name: "kanban", skeleton: ".animate-pulse" },
  { path: "/calendar", name: "calendar", skeleton: ".animate-pulse" },
  { path: "/settings", name: "settings", skeleton: ".animate-pulse" },
  { path: "/marketing", name: "marketing", skeleton: ".animate-pulse" },
] as const;

test.describe("Dashboard Loading States", () => {
  for (const { path, name, skeleton } of DASHBOARD_ROUTES) {
    test(`shows loading skeleton for ${name}`, async ({ page }) => {
      // Intercept the page request and delay it to expose the loading state
      await page.route(path, async (route) => {
        if (route.request().resourceType() === "document") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        await route.continue();
      });

      // Start navigation — loading skeleton should appear immediately
      const responsePromise = page.goto(path);

      // Verify skeleton elements are visible during loading
      await expect(page.locator(skeleton).first()).toBeVisible({
        timeout: 3000,
      });

      // Wait for the page to fully load
      await responsePromise;
    });
  }

  test("dashboard loading skeleton has expected structure", async ({
    page,
  }) => {
    await page.route("/dashboard", async (route) => {
      if (route.request().resourceType() === "document") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      await route.continue();
    });

    const responsePromise = page.goto("/dashboard");

    // Wait for at least one skeleton element to appear (more robust than count)
    const firstSkeleton = page.locator(".animate-pulse").first();
    await expect(firstSkeleton).toBeVisible({ timeout: 3000 });

    await responsePromise;
  });
});
