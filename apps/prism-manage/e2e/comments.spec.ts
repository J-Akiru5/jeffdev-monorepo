import { test, expect, requireCreds, e2eTitle } from "./fixtures";

test.describe("task comments", () => {
  test.beforeEach(() => requireCreds());

  test("commenting shows the comment, author, and activity", async ({
    page,
  }) => {
    const title = e2eTitle("comment");
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    // Create the task
    await page.getByRole("button", { name: "Add a task" }).first().click();
    const input = page
      .getByPlaceholder("Task title... (press Enter for quick-add)")
      .first();
    await input.fill(title);
    await input.press("Enter");

    const row = page.locator("div.group.flex.items-start", { hasText: title });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Open the task sheet (intercepting route modal)
    await row.getByText(title, { exact: true }).click();

    const commentBox = page.getByPlaceholder(
      "Add a comment… (@mention teammates, ⌘⏎ to send)",
    );
    await expect(commentBox).toBeVisible({ timeout: 15_000 });
    await commentBox.fill("e2e comment body");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("e2e comment body")).toBeVisible({
      timeout: 15_000,
    });

    // Scope the author check to the comment card (assignee <option>s in the
    // sheet also contain the account name)
    const commentCard = page
      .locator("div.rounded-lg.border.border-border.bg-glass-04")
      .filter({ hasText: "e2e comment body" });
    await expect(commentCard.getByText("E2E Test Account")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("created this task")).toBeVisible({
      timeout: 15_000,
    });

    // R1: save the comment thread to the Company Brain
    await page.getByRole("button", { name: "Save to Brain" }).click();
    await expect(
      page.getByText(/Thread (distilled|saved) to the Brain/),
    ).toBeVisible({ timeout: 20_000 });

    // A11y: Escape closes the sheet
    await page.keyboard.press("Escape");
    await expect(
      page.getByPlaceholder("Add a comment… (@mention teammates, ⌘⏎ to send)"),
    ).toHaveCount(0, { timeout: 10_000 });
  });
});
