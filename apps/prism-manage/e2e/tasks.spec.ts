import { test, expect, requireCreds, e2eTitle } from "./fixtures";

test.describe("task CRUD", () => {
  test.beforeEach(() => requireCreds());

  test("create, star, and delete a task", async ({ page }) => {
    const title = e2eTitle("task");
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    // Create via the first inline input
    await page.getByRole("button", { name: "Add a task" }).first().click();
    const input = page
      .getByPlaceholder("Task title... (press Enter for quick-add)")
      .first();
    await input.fill(title);
    await input.press("Enter");

    const row = page.locator("div.group.flex.items-start", { hasText: title });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // A11y: the completion toggle is labelled
    await expect(
      row.getByRole("button", { name: "Mark complete" }),
    ).toBeVisible();

    // Star it — the icon fills in
    await row.hover();
    const star = row.getByRole("button", { name: /^(Star|Unstar) task$/ });
    await star.click();
    await expect(star.locator("svg")).toHaveAttribute("fill", "currentColor", {
      timeout: 10_000,
    });

    // Delete via the row menu + confirm dialog
    await row.getByRole("button", { name: "Task actions" }).click();
    await page.getByRole("button", { name: "Delete" }).last().click();
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Delete" }).click();
    await expect(row).toHaveCount(0, { timeout: 15_000 });
  });
});
