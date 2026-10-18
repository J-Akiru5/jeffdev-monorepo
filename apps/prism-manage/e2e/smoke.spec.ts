import { test, expect, requireCreds } from "./fixtures";

const ROUTES: Array<{ path: string; marker: string; exact?: boolean }> = [
  { path: "/tasks", marker: "All Tasks" },
  { path: "/kanban", marker: "Kanban Board" },
  // exact: the calendar page also renders a "Google Calendar Sync" heading
  { path: "/calendar", marker: "Calendar", exact: true },
  { path: "/settings", marker: "Workspace Members" },
];

test.describe("route smoke", () => {
  test.beforeEach(() => requireCreds());

  test("dashboard renders", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Unable to load")).toHaveCount(0);
  });

  for (const route of ROUTES) {
    test(`${route.path} renders`, async ({ page }) => {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.marker, exact: route.exact }),
      ).toBeVisible({ timeout: 20_000 });
    });
  }
});
