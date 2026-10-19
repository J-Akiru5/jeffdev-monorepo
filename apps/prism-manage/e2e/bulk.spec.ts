import { createClient } from "@supabase/supabase-js";
import { test, expect, requireCreds } from "./fixtures";

/**
 * Bulk actions (arc 3 · D2)
 * -------------------------
 * Seeds three tasks, selects them in the table view, and bulk-updates their
 * status through the bar.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

test.describe("bulk actions", () => {
  test.beforeEach(() => requireCreds());

  test("bulk status update from the table view", async ({ page }) => {
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

    const stamp = Date.now().toString(36);
    const titles = [1, 2, 3].map((n) => `e2e-bulk-${stamp}-${n}`);
    const { error } = await admin.from("tasks").insert(
      titles.map((title) => ({
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
    await page.getByRole("button", { name: "Table" }).click();

    for (const title of titles) {
      await page.getByRole("checkbox", { name: `Select ${title}` }).check();
    }
    await expect(page.getByText("3 selected")).toBeVisible();

    await page.getByLabel("Bulk status").selectOption("todo");
    await expect(page.getByText(/Status updated: 3 tasks/)).toBeVisible({
      timeout: 20_000,
    });

    for (const title of titles) {
      const row = page.locator("tr", { hasText: title });
      await expect(row.getByText("To Do")).toBeVisible({ timeout: 15_000 });
    }
  });
});
