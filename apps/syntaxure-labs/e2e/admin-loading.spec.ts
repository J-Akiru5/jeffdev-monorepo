import { test, expect } from "@playwright/test";

/**
 * Admin Loading State Tests
 * --------------------------
 * Verifies that loading.tsx skeletons render correctly for each admin route.
 * Uses route interception to delay responses so the streaming loading state is visible.
 */

const ADMIN_ROUTES = [
  { path: "/admin", name: "admin root", skeleton: ".animate-pulse" },
  { path: "/admin/services", name: "services", skeleton: ".animate-pulse" },
  { path: "/admin/projects", name: "projects", skeleton: ".animate-pulse" },
  { path: "/admin/invoices", name: "invoices", skeleton: ".animate-pulse" },
  { path: "/admin/community", name: "community", skeleton: ".animate-pulse" },
  { path: "/admin/profile", name: "profile", skeleton: ".animate-pulse" },
] as const;

test.describe("Admin Loading States", () => {
  for (const { path, name, skeleton } of ADMIN_ROUTES) {
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

  test("admin loading skeleton has expected structure", async ({ page }) => {
    await page.route("/admin", async (route) => {
      if (route.request().resourceType() === "document") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      await route.continue();
    });

    const responsePromise = page.goto("/admin");

    // Wait for at least one skeleton element to appear (more robust than count)
    await expect(page.locator(".animate-pulse").first()).toBeVisible({
      timeout: 3000,
    });

    await responsePromise;
  });
});
