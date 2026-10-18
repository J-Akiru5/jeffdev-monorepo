import { createClient } from "@supabase/supabase-js";
import { test, expect, requireCreds } from "./fixtures";

/**
 * Task pagination (H5)
 * --------------------
 * Seeds 55 staggered tasks via the service role, then verifies the tasks
 * page pages through them: a full first page shows "Load more", and loading
 * the tail hides it again.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

test.describe("task pagination", () => {
  test.beforeEach(() => requireCreds());

  test("load more fetches the next page and exhausts the list", async ({
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

    // 55 staggered tasks → page 1 = 50, page 2 = the remaining 5.
    const stamp = Date.now().toString(36);
    const rows = Array.from({ length: 55 }, (_, i) => ({
      user_id: user.id,
      workspace_id: membership!.workspace_id,
      pm_project_id: project!.id,
      title: `e2e-page-${stamp}-${String(i).padStart(2, "0")}`,
      status: "backlog",
      task_type: "uncategorized",
      created_at: new Date(Date.now() - i * 1_000).toISOString(),
    }));
    const { error } = await admin.from("tasks").insert(rows);
    expect(error).toBeNull();

    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });

    const loadMore = page.getByRole("button", { name: "Load more" });
    await expect(loadMore).toBeVisible({ timeout: 15_000 });
    await loadMore.click();
    await expect(loadMore).toHaveCount(0, { timeout: 15_000 });
  });
});
