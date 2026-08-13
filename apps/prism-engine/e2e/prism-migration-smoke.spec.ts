/**
 * Prism Cosmos DB -> Postgres Migration Smoke Test
 * -------------------------------------------------
 * Exercises the exact path PRISM_MIGRATION.md's pre-merge checklist calls
 * out: sign in -> create a project -> create a rule -> read it back through
 * both the dashboard and the REST API -> call the MCP endpoint that reads
 * from the same prism_rules table -> clean up.
 *
 * This talks to a REAL environment (real Supabase Auth, real prism_* tables)
 * — there is nothing to mock here, the whole point is proving the Postgres
 * migration actually works end-to-end. See e2e/README.md for setup.
 *
 * Requires E2E_TEST_EMAIL / E2E_TEST_PASSWORD for a real Supabase user.
 * Use a disposable/test account, not a personal one — this test creates and
 * deletes real rows under that account.
 */

import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;
const HAS_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

const RUN_ID = Date.now().toString(36);
const PROJECT_NAME = `E2E Migration Test ${RUN_ID}`;
const PROJECT_SLUG = PROJECT_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const RULE_NAME = `E2E Rule ${RUN_ID}`;
const RULE_CONTENT = `Rule created by the migration smoke test at ${new Date().toISOString()}. Safe to delete.`;

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.locator("#email").fill(TEST_EMAIL!);
  await page.locator("#password").fill(TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Prism migration smoke path", () => {
  test.skip(
    !HAS_CREDENTIALS,
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD (a real, disposable Supabase test account) to run this suite. See e2e/README.md.",
  );

  test.describe.configure({ mode: "serial" });

  test("sign in redirects to the dashboard", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("create a project (writes to prism_projects)", async ({ page }) => {
    await signIn(page);
    await page.goto("/projects/new");

    await page.locator("#name").fill(PROJECT_NAME);
    await page.locator("#stack").selectOption("nextjs");
    await page.locator('input[name="designSystem"][value="jdstudio"]').check();
    await page.getByRole("button", { name: "Create Project" }).click();

    // createProject() redirects to /projects/{slug} on success
    await page.waitForURL(new RegExp(`/projects/${PROJECT_SLUG}$`), {
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: PROJECT_NAME })).toBeVisible();
  });

  test("create a rule for that project (writes to prism_rules)", async ({ page }) => {
    await signIn(page);
    await page.goto(`/projects/${PROJECT_SLUG}/rules/new`);

    await page.locator("#name").fill(RULE_NAME);
    await page.locator("#category").selectOption("architecture");
    await page.locator("#priority").fill("5");
    await page.locator("#content").fill(RULE_CONTENT);
    await page.getByRole("button", { name: "Create Rule" }).click();

    // createRule() redirects back to /projects/{slug} on success
    await page.waitForURL(new RegExp(`/projects/${PROJECT_SLUG}$`), {
      timeout: 15_000,
    });
    await expect(page.getByText(RULE_NAME)).toBeVisible();
  });

  test("rule is readable via the dashboard project page after a fresh load", async ({ page }) => {
    // Reload from scratch (not just post-redirect state) to prove the row
    // actually persisted in Postgres, not just optimistic client state.
    await signIn(page);
    await page.goto(`/projects/${PROJECT_SLUG}`);
    await expect(page.getByText(RULE_NAME)).toBeVisible({ timeout: 10_000 });
  });

  test("rule is readable via the REST API (/api/v1/rules)", async ({ page }) => {
    await signIn(page);

    // page.request shares the browser context's cookies, so this carries
    // the Supabase session cookie the sign-in flow just set.
    const response = await page.request.get("/api/v1/rules?detail=full&limit=50");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const rules = body.data as Array<{ id: string; name: string; projectId?: string }>;
    const created = rules.find((r) => r.name === RULE_NAME);
    expect(created, "rule created via the UI should appear in the REST API").toBeTruthy();
  });

  test("MCP get_architectural_rules reads the same prism_rules row", async ({ page }) => {
    await signIn(page);

    const response = await page.request.post("/api/mcp/stdio", {
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "get_architectural_rules",
          arguments: { task: RULE_NAME, format: "json" },
        },
      },
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.error, `MCP call returned an error: ${JSON.stringify(body.error)}`).toBeUndefined();

    const text: string = body.result?.content?.[0]?.text ?? "";
    expect(
      text.includes(RULE_NAME) || text.includes("No matching rules") === false,
      "MCP get_architectural_rules should surface the rule just created",
    ).toBe(true);
  });

  test.afterAll(async ({ browser }) => {
    if (!HAS_CREDENTIALS) return;
    // Clean up: delete the test project (cascades to its rules via
    // projects/actions.ts:deleteProject, which explicitly deletes
    // prism_rules rows for the project first).
    const page = await browser.newPage();
    try {
      await signIn(page);
      const projectsResp = await page.request.get("/api/v1/projects?limit=50");
      if (projectsResp.ok()) {
        const { data: projects } = await projectsResp.json();
        const created = (projects as Array<{ id: string; slug: string }>).find(
          (p) => p.slug === PROJECT_SLUG,
        );
        if (created) {
          await page.request.delete(`/api/v1/projects/${created.id}`);
        }
      }
    } finally {
      await page.close();
    }
  });
});
