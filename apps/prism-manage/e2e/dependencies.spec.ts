import { createClient } from "@supabase/supabase-js";
import { test, expect, requireCreds, e2eTitle } from "./fixtures";

/**
 * Task dependencies (arc 3 · D4)
 * ------------------------------
 * Seeds a blocker and a blocked task, wires the dependency from the sheet,
 * asserts the Blocked badge, and proves approval is gated until the blocker
 * is completed.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

test.describe("task dependencies", () => {
  test.beforeEach(() => {
    requireCreds();
    // This spec drives several server actions + reloads; under a loaded
    // suite (6 workers) it needs the extended budget.
    test.slow();
  });

  test("blocked tasks cannot be completed until the blocker is done", async ({
    page,
  }) => {
    test.skip(!url || !serviceKey, "service role not configured");

    const admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    });
    const { data: users } = await admin.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === email);
    if (!user) {
      test.skip(true, "e2e account missing — run the Playwright global setup");
      return;
    }

    const { data: membership } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("role", "founder")
      .maybeSingle();
    const { data: project } = await admin
      .from("pm_projects")
      .select("id")
      .eq("workspace_id", membership!.workspace_id)
      .eq("name", "General")
      .maybeSingle();

    const blockerTitle = e2eTitle("dep-blocker");
    const blockedTitle = e2eTitle("dep-blocked");
    const { error } = await admin.from("tasks").insert(
      [blockerTitle, blockedTitle].map((title) => ({
        user_id: user.id,
        workspace_id: membership!.workspace_id,
        pm_project_id: project!.id,
        title,
        status: "backlog",
        task_type: "uncategorized",
      })),
    );
    expect(error).toBeNull();

    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    // Open the blocked task and add the blocker from the sheet
    const rowB = page.locator("div.group.flex.items-start", {
      hasText: blockedTitle,
    });
    await expect(rowB).toBeVisible({ timeout: 15_000 });
    await rowB.getByText(blockedTitle, { exact: true }).click();
    await expect(page.getByLabel("Add a blocker")).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByLabel("Add a blocker")
      .selectOption({ label: blockerTitle });
    await expect(page.getByText("Blocker added")).toBeVisible({
      timeout: 15_000,
    });
    await page.keyboard.press("Escape");

    // Reload → the blocked row shows the badge (page load can be slow under
    // the full suite's parallel workers, hence the generous timeout).
    await page.reload();
    const rowB2 = page.locator("div.group.flex.items-start", {
      hasText: blockedTitle,
    });
    await expect(rowB2.getByText("Blocked", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // Completing the blocked task fails with the specific reason
    await rowB2.getByRole("button", { name: "Mark complete" }).click();
    await expect(
      page.getByText(/Task is blocked by 1 open task/),
    ).toBeVisible({ timeout: 15_000 });

    // Complete the blocker… (it moves into the collapsed Completed section)
    const rowA = page.locator("div.group.flex.items-start", {
      hasText: blockerTitle,
    });
    await rowA.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByText(/Completed \(\d+\)/)).toBeVisible({
      timeout: 15_000,
    });

    // …then the blocked task can be completed
    await page.reload();
    const rowB3 = page.locator("div.group.flex.items-start", {
      hasText: blockedTitle,
    });
    await rowB3.getByRole("button", { name: "Mark complete" }).click();
    // Completed → its toggle leaves the incomplete state
    await expect(
      rowB3.getByRole("button", { name: "Mark complete" }),
    ).toHaveCount(0, { timeout: 15_000 });
  });
});
