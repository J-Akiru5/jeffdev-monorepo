import { test, expect, requireCreds } from "./fixtures";

/**
 * The E2E account is an employee of Syntaxure Labs — perfect for verifying
 * the operations RBAC (CEO/COO only) from the outside.
 */
test.describe("operations RBAC (employee account)", () => {
  test.beforeEach(() => requireCreds());

  test("employee is redirected from /operations", async ({ page }) => {
    await page.goto("/operations");
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("employee is redirected from /bmc", async ({ page }) => {
    await page.goto("/bmc");
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("sidebar hides Operations links for employees", async ({ page }) => {
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('a[href="/operations"]')).toHaveCount(0);
    await expect(page.locator('a[href="/bmc"]')).toHaveCount(0);
  });
});
