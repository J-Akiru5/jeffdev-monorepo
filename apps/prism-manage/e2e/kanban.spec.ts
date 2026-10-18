import { test, expect, requireCreds, e2eTitle } from "./fixtures";
import type { Page } from "@playwright/test";

function desktopColumn(page: Page, name: string) {
  return page
    .locator("div.glass-subtle.rounded-xl")
    .filter({ visible: true })
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
}

async function switchToSyntaxure(page: Page) {
  const switcher = page.locator('[data-tour="workspace-switcher"]');
  await switcher.locator("button").first().click();
  await switcher.getByRole("button", { name: /Syntaxure Labs/ }).click();
  await expect(switcher.locator("button").first()).toContainText(
    "Syntaxure Labs",
  );
}

async function quickAdd(page: Page, columnName: string, title: string) {
  const column = desktopColumn(page, columnName);

  // The dialog silently no-ops while workspace lists are still loading
  // ("Create a list first" toast) — retry until the card appears.
  for (let attempt = 1; attempt <= 3; attempt++) {
    await column.getByRole("button", { name: "Add task" }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("Task title…").fill(title);
    await dialog.getByRole("button", { name: "Add task" }).click();

    try {
      await expect(
        column.locator('div[draggable="true"]', { hasText: title }),
      ).toBeVisible({ timeout: 8_000 });
      return;
    } catch {
      if (attempt === 3) {
        throw new Error(`quick-add never created "${title}" in ${columnName}`);
      }
    }
  }
}

async function dragCardToColumn(
  sourceColumn: string,
  targetColumn: string,
  title: string,
  page: Page,
) {
  const card = desktopColumn(page, sourceColumn).locator(
    'div[draggable="true"]',
    { hasText: title },
  );
  const target = desktopColumn(page, targetColumn);
  await expect(card).toBeVisible({ timeout: 15_000 });

  // The board can refetch (realtime) mid-drag and swallow the drop — retry once.
  for (let attempt = 1; attempt <= 2; attempt++) {
    await card.dragTo(target);
    try {
      await expect(
        target.locator('div[draggable="true"]', { hasText: title }),
      ).toBeVisible({ timeout: 8_000 });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error(`drag to "${targetColumn}" failed for "${title}"`);
      }
    }
  }
}

test.describe("kanban", () => {
  test.beforeEach(() => requireCreds());

  test("quick-add creates a task in the target column", async ({ page }) => {
    const title = e2eTitle("kanban");
    await page.goto("/kanban");
    await expect(
      page.getByRole("heading", { name: "Kanban Board" }),
    ).toBeVisible({ timeout: 20_000 });
    await quickAdd(page, "To Do", title);
  });

  test("drag moves a task between columns", async ({ page }) => {
    const title = e2eTitle("drag");
    await page.goto("/kanban");
    await expect(
      page.getByRole("heading", { name: "Kanban Board" }),
    ).toBeVisible({ timeout: 20_000 });

    await quickAdd(page, "Backlog", title);
    await dragCardToColumn("Backlog", "In Progress", title, page);
  });

  test("employees cannot move tasks into Approved", async ({ page }) => {
    const title = e2eTitle("approved");
    await page.goto("/kanban");
    await expect(
      page.getByRole("heading", { name: "Kanban Board" }),
    ).toBeVisible({ timeout: 20_000 });

    // The Approved-column RBAC applies inside Syntaxure Labs — switch there
    await switchToSyntaxure(page);
    await quickAdd(page, "Backlog", title);

    const card = desktopColumn(page, "Backlog").locator(
      'div[draggable="true"]',
      { hasText: title },
    );
    const approved = desktopColumn(page, "Approved");

    // Drag to Approved — the RBAC block must fire. Retry once if the board
    // refetched mid-drag and swallowed the drop.
    for (let attempt = 1; attempt <= 2; attempt++) {
      await card.dragTo(approved);
      try {
        await expect(
          page.getByText("Only founders and the CPO can approve tasks"),
        ).toBeVisible({ timeout: 6_000 });
        break;
      } catch {
        if (attempt === 2) {
          throw new Error("approved-drag RBAC toast never appeared");
        }
      }
    }

    await expect(
      approved.locator('div[draggable="true"]', { hasText: title }),
    ).toHaveCount(0);
  });
});
