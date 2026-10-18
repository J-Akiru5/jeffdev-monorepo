import { createClient } from "@supabase/supabase-js";
import { test, expect, requireCreds, e2eTitle } from "./fixtures";

/**
 * Recurring tasks (new plan)
 * --------------------------
 * Completing a recurring occurrence spawns the next one. Seeds a weekly
 * task via the service role, completes it in the UI, and asserts the next
 * occurrence appears with its recurrence badge.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

test.describe("recurring tasks", () => {
  test.beforeEach(() => requireCreds());

  test("completing a weekly task spawns the next occurrence", async ({
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

    const title = e2eTitle("recur");
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const { error } = await admin.from("tasks").insert({
      user_id: user.id,
      workspace_id: membership!.workspace_id,
      pm_project_id: project!.id,
      title,
      status: "backlog",
      task_type: "uncategorized",
      recurrence: "weekly",
      due_date: past,
    });
    expect(error).toBeNull();

    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    const row = page.locator("div.group.flex.items-start", { hasText: title });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText("Weekly")).toBeVisible();

    // Complete it → the next occurrence spawns
    await row.getByRole("button", { name: "Mark complete" }).click();

    // The spawned occurrence keeps the title and the recurrence badge; the
    // completed one moves into the collapsed Completed section (in the DOM
    // but not visible) — filter to the visible occurrence.
    const nextRow = page
      .locator("div.group.flex.items-start", { hasText: title })
      .filter({ visible: true });
    await expect(nextRow).toBeVisible({ timeout: 15_000 });
    await expect(nextRow.getByText("Weekly")).toBeVisible();
    await expect(
      nextRow.getByRole("button", { name: "Mark complete" }),
    ).toBeVisible();
  });
});
