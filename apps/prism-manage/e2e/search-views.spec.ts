import { test, expect, requireCreds, e2eTitle } from "./fixtures";

test.describe("search, saved views, and table view", () => {
  test.beforeEach(() => requireCreds());

  test("search narrows the visible list", async ({ page }) => {
    const a = e2eTitle("srch-a");
    const b = e2eTitle("srch-b");
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    for (const title of [a, b]) {
      await page.getByRole("button", { name: "Add a task" }).first().click();
      const input = page
        .getByPlaceholder("Task title... (press Enter for quick-add)")
        .first();
      await input.fill(title);
      await input.press("Enter");
      await expect(
        page.locator("div.group.flex.items-start", { hasText: title }),
      ).toBeVisible({ timeout: 15_000 });
    }

    const search = page.getByPlaceholder("Search tasks…");
    await search.fill(a);
    await expect(
      page.locator("div.group.flex.items-start", { hasText: a }),
    ).toBeVisible();
    await expect(
      page.locator("div.group.flex.items-start", { hasText: b }),
    ).toHaveCount(0);

    await search.fill("");
    await expect(
      page.locator("div.group.flex.items-start", { hasText: b }),
    ).toBeVisible();
  });

  test("saved views save, apply, and delete", async ({ page }) => {
    const viewName = e2eTitle("view");
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    // Filter → save as view
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("todo");
    await expect(page.getByText("filters active")).toBeVisible();

    await page.getByRole("button", { name: /^Views/ }).click();
    await page.getByPlaceholder("Save current view as…").fill(viewName);
    await page.getByRole("button", { name: "Save" }).click();
    const viewButton = page.getByRole("button", { name: viewName });
    await expect(viewButton).toBeVisible({ timeout: 15_000 });

    // Change the filter, then re-apply the view
    await statusSelect.selectOption("in_progress");
    await viewButton.click();
    await expect(statusSelect).toHaveValue("todo");

    // Delete the view
    await page.getByRole("button", { name: /^Views/ }).click();
    const viewItem = page
      .getByRole("listitem")
      .filter({ hasText: viewName })
      .filter({ has: page.getByRole("button", { name: "Delete view" }) });
    await viewItem.hover();
    await viewItem.getByRole("button", { name: "Delete view" }).click();
    await expect(
      page.getByRole("button", { name: viewName }),
    ).toHaveCount(0, { timeout: 15_000 });
  });

  test("table view renders the task table", async ({ page }) => {
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Table" }).click();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Title" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
  });
});
