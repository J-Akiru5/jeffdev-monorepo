import { test, expect, requireCreds } from "./fixtures";

test.describe("auth", () => {
  test("unauthenticated visitors are redirected to sign-in", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/tasks");
    await page.waitForURL(/\/sign-in/, { timeout: 20_000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await context.close();
  });

  test("authenticated session reaches the task list", async ({ page }) => {
    requireCreds();
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "New Task" })).toBeVisible();
  });
});
