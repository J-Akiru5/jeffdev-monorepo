import { createClient } from "@supabase/supabase-js";
import { test, expect, requireCreds, e2eTitle } from "./fixtures";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

test.describe("company brain", () => {
  test.beforeEach(() => requireCreds());

  test("capture a decision, find it in the timeline, search, and ask", async ({
    page,
  }) => {
    const title = e2eTitle("decision");
    await page.goto("/brain");
    await expect(
      page.getByRole("heading", { name: "Company Brain", exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    // Capture
    await page.getByRole("button", { name: "Log decision" }).click();
    await page.getByPlaceholder("What was decided?").fill(title);
    await page
      .getByPlaceholder("Context — what changed and why it matters")
      .fill(
        "e2e context: chose the managed approach over self-hosting because it ships faster.",
      );
    await page.getByRole("button", { name: "Save decision" }).click();

    await expect(page.getByText(title).first()).toBeVisible({
      timeout: 15_000,
    });

    // Source filters (R1): agent sessions exclude the decision; Decisions re-includes it
    await page.getByRole("button", { name: "Agent sessions" }).click();
    await expect(page.getByText(title)).toHaveCount(0);
    await page.getByRole("button", { name: "Decisions", exact: true }).click();
    await expect(page.getByText(title).first()).toBeVisible();

    // Search
    await page.getByPlaceholder("Search memories…").fill(title);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Search results" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(title).first()).toBeVisible();

    // Ask (no LLM needed — citations come back even without a key)
    await page
      .getByPlaceholder("Ask the brain — e.g. why did we pick Supabase?")
      .fill(title);
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /Answer|Closest matches/ }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test("task sheet surfaces related memories (arc 3 · D5)", async ({
    page,
  }) => {
    test.skip(!url || !serviceKey, "service role not configured");
    test.slow();
    const memTitle = e2eTitle("mem");

    // 1) Capture a memory whose title is a distinctive phrase
    await page.goto("/brain");
    await expect(
      page.getByRole("heading", { name: "Company Brain", exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Log decision" }).click();
    await page.getByPlaceholder("What was decided?").fill(memTitle);
    await page
      .getByPlaceholder("Context — what changed and why it matters")
      .fill("e2e context for the related-memories check.");
    await page.getByRole("button", { name: "Save decision" }).click();
    await expect(page.getByText(memTitle).first()).toBeVisible({
      timeout: 15_000,
    });

    // 2) Seed a task with the same title — semantic hit locally, keyword
    //    fallback in environments without an embedding key. Either matches.
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
    const { error } = await admin.from("tasks").insert({
      user_id: user.id,
      workspace_id: membership!.workspace_id,
      pm_project_id: project!.id,
      title: memTitle,
      status: "backlog",
      task_type: "uncategorized",
    });
    expect(error).toBeNull();

    // 3) Open the task → the memory shows under Related memories
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: "All Tasks" }),
    ).toBeVisible({ timeout: 20_000 });
    const row = page.locator("div.group.flex.items-start", {
      hasText: memTitle,
    });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByText(memTitle, { exact: true }).click();
    await expect(page.getByText("Related memories")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText("e2e context for the related-memories check."),
    ).toBeVisible({ timeout: 20_000 });
  });
});
