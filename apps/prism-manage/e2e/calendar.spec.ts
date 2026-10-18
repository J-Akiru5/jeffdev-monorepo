import { test, expect, requireCreds, e2eTitle } from "./fixtures";

test.describe("calendar", () => {
  test.beforeEach(() => requireCreds());

  test("creating an event via a day drag shows it on the calendar", async ({
    page,
  }) => {
    const title = e2eTitle("cal");
    await page.goto("/calendar");
    await expect(
      page.getByRole("heading", { name: "Calendar", exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    // Drag inside a mid-month day cell → FullCalendar fires `select`
    const day = page.locator(".fc-daygrid-day").nth(14);
    const box = await day.boundingBox();
    if (!box) throw new Error("day cell not visible");
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.65, {
      steps: 8,
    });
    await page.mouse.up();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByPlaceholder("Event title…").fill(title);
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(page.locator(".fc-event", { hasText: title })).toBeVisible({
      timeout: 15_000,
    });
  });
});
