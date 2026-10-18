import { test, expect, requireCreds } from "./fixtures";

test.describe("notifications", () => {
  test.beforeEach(() => requireCreds());

  test("bell opens the live notification panel", async ({ page }) => {
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.locator('button[title="Notifications"]').click();
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/Live updates enabled|Latest \d+/),
    ).toBeVisible({ timeout: 10_000 });

    // Close via the panel's X
    await page.getByRole("button", { name: "Close notifications" }).click();
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toHaveCount(0);
  });
});
