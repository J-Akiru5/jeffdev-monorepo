import { test, expect, requireCreds, e2eTitle } from "./fixtures";

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
});
