import { createClient } from "@supabase/supabase-js";
import { test, expect, requireCreds } from "./fixtures";

/**
 * Pages block editor (arc 3 · D6)
 * -------------------------------
 * Seeds a page with one block of each type, asserts the editor renders them,
 * edits (adds a block, toggles a checklist item), waits for the autosave, and
 * reloads to prove persistence.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

test.describe("pages block editor", () => {
  test.beforeEach(() => {
    requireCreds();
    test.slow();
  });

  test("renders seeded blocks, edits, and persists", async ({ page }) => {
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

    const stamp = Date.now().toString(36);
    const title = `e2e-page-${stamp}`;
    const headingText = `e2e-heading-${stamp}`;
    const itemText = `e2e-item-${stamp}`;
    const codeText = `const x = "e2e-${stamp}";`;

    const { data: pageRow, error } = await admin
      .from("pages")
      .insert({
        workspace_id: membership!.workspace_id,
        created_by: user.id,
        title,
        icon: "📄",
        content: [
          { id: "b1", type: "heading", text: headingText },
          { id: "b2", type: "text", text: `e2e body ${stamp}` },
          { id: "b3", type: "checklist", text: itemText, checked: true },
          { id: "b4", type: "code", text: codeText },
          { id: "b5", type: "divider", text: "" },
        ],
        sort_order: 0,
      })
      .select("id")
      .single();
    expect(error).toBeNull();

    await page.goto(`/pages/${pageRow!.id}`);

    // Renders every seeded block type
    await expect(page.getByLabel("Page title")).toHaveValue(title, {
      timeout: 20_000,
    });
    await expect(page.locator("textarea").nth(0)).toHaveValue(headingText);
    await expect(page.locator("textarea").nth(2)).toHaveValue(itemText);
    await expect(page.locator("textarea").nth(3)).toHaveValue(codeText);
    await expect(page.getByRole("checkbox").first()).toBeChecked();

    // Add a block and type into it
    await page.getByRole("button", { name: "Add block" }).click();
    const addedText = `e2e-added-${stamp}`;
    const last = page.locator("textarea").last();
    await last.fill(addedText);

    // Toggle the checklist item off
    await page.getByRole("checkbox").first().uncheck();

    // Wait out the 800ms autosave, then reload to prove persistence
    await page.waitForTimeout(1600);
    await page.reload();

    await expect(page.getByLabel("Page title")).toHaveValue(title, {
      timeout: 20_000,
    });
    await expect(page.locator("textarea").last()).toHaveValue(addedText, {
      timeout: 20_000,
    });
    await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  });
});
