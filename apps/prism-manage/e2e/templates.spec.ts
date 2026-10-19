import { test, expect, requireCreds, e2eTitle } from "./fixtures";

test.describe("task templates", () => {
  test.beforeEach(() => requireCreds());

  test("save a task as a template and start a new task from it", async ({
    page,
  }) => {
    const title = e2eTitle("tmpl-task");
    const templateName = e2eTitle("tmpl");

    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    // Create the source task
    await page.getByRole("button", { name: "Add a task" }).first().click();
    const input = page
      .getByPlaceholder("Task title... (press Enter for quick-add)")
      .first();
    await input.fill(title);
    await input.press("Enter");
    const row = page.locator("div.group.flex.items-start", { hasText: title });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Open it and save as a template
    await row.getByText(title, { exact: true }).click();
    await page.getByRole("button", { name: "Save as template" }).click();
    await page.getByPlaceholder("Template name…").fill(templateName);
    await page.getByRole("button", { name: "Save template" }).click();
    await expect(page.getByText("Template saved")).toBeVisible({
      timeout: 15_000,
    });

    // Close the sheet and open the create flow
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "New Task" }).click();
    await expect(page.getByLabel("Start from template")).toBeVisible({
      timeout: 15_000,
    });

    // Apply the template — the title field fills from it
    await page
      .getByLabel("Start from template")
      .selectOption({ label: templateName });
    await expect(page.locator("textarea").first()).toHaveValue(title);
  });
});
