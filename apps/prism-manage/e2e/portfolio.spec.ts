import { createClient } from "@supabase/supabase-js";
import { E2E_READY, expect, requireCreds, test } from "./fixtures";

/**
 * Portfolio tracker E2E (Phase 3)
 * ------------------------------
 * One founder journey through the real UI:
 *
 *   a. the seeded ventures render on /portfolio
 *   b. create a project (kind, status, free-text client name) → card appears
 *   c. detail: progress → 60%, add a milestone, complete it
 *   d. search filters the list down to the new project
 *   e. edit: status → maintenance + retainer ₱2,500/mo (founder-only figures)
 *   f. archive → the project stays listed with an Archived badge
 *
 * Fixture note — the dedicated E2E account is provisioned as an *employee* in
 * the Syntaxure Labs workspace (e2e/global-setup.ts) while the portfolio's
 * create / edit / archive controls are gated on that workspace's role. The
 * server already treats the account as a portfolio founder (its Personal
 * membership is `founder`), so this suite promotes the dedicated test account
 * for the duration of the run and restores the previous role afterwards.
 * global-setup re-asserts `employee` on the next run, so a crashed restore is
 * self-healing. Moving this grant into global-setup is the durable fix.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";

let syntaxureWorkspaceId: string | null = null;
let previousRole: string | null = null;
let promoted = false;

function adminClient() {
  return createClient(supabaseUrl!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.beforeAll(async () => {
  if (!E2E_READY || !supabaseUrl || !serviceKey) return;

  const admin = adminClient();
  const { data: list } = await admin.auth.admin.listUsers();
  const user = list?.users.find((candidate) => candidate.email === email);
  if (!user) return;

  const { data: memberships } = await admin
    .from("workspace_members")
    .select("workspace_id, role, workspaces(name)")
    .eq("user_id", user.id);

  const syntaxure = memberships?.find((row) =>
    String((row.workspaces as { name?: string } | null)?.name ?? "").startsWith(
      "Syntaxure Labs",
    ),
  );
  if (!syntaxure) return;

  syntaxureWorkspaceId = String(syntaxure.workspace_id);
  previousRole = String(syntaxure.role);
  if (previousRole === "founder") return;

  const { error } = await admin
    .from("workspace_members")
    .update({ role: "founder" })
    .eq("workspace_id", syntaxureWorkspaceId)
    .eq("user_id", user.id);
  promoted = !error;
});

test.afterAll(async () => {
  if (!promoted || !syntaxureWorkspaceId || !previousRole) return;

  const admin = adminClient();
  const { data: list } = await admin.auth.admin.listUsers();
  const user = list?.users.find((candidate) => candidate.email === email);
  if (!user) return;

  await admin
    .from("workspace_members")
    .update({ role: previousRole })
    .eq("workspace_id", syntaxureWorkspaceId)
    .eq("user_id", user.id);
});

/** `YYYY-MM-DD` n days from today (UTC — the app compares date-only values in UTC). */
function dateIn(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe("portfolio tracker", () => {
  test.beforeEach(() => requireCreds());

  test("create → progress → milestone → search → edit → archive", async ({
    page,
  }) => {
    test.slow();

    const stamp = Date.now().toString(36);
    const projectTitle = `e2e-portfolio-${stamp}`;
    const clientName = `e2e-client-${stamp}`;
    const milestoneTitle = `e2e-milestone-${stamp}`;

    // (a) List renders with the three seeded ventures.
    await page.goto("/portfolio");
    await expect(
      page.getByRole("heading", { name: "Portfolio", level: 1 }),
    ).toBeVisible({ timeout: 60_000 });
    for (const venture of [
      "LikasLens",
      "RiceConnect",
      "Golf Management System",
    ]) {
      await expect(
        page.getByRole("link", { name: venture, exact: true }),
      ).toBeVisible({ timeout: 30_000 });
    }

    // (b) Create: client kind, in progress, free-text client name.
    await page.getByRole("button", { name: "New project" }).first().click();
    const createDialog = page.getByRole("dialog", { name: "New project" });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Title").fill(projectTitle);
    await createDialog.getByLabel("Kind").selectOption("client");
    await createDialog.getByLabel("Portfolio status").selectOption("in_progress");
    await createDialog.getByLabel("Client name").fill(clientName);
    await createDialog.getByRole("button", { name: "Create project" }).click();
    await expect(createDialog).toHaveCount(0, { timeout: 30_000 });

    const card = page.locator("article").filter({ hasText: projectTitle });
    await expect(card).toBeVisible({ timeout: 30_000 });
    // The client name proves the server resolved/created the `clients` row and
    // joined it back onto the project.
    await expect(card).toContainText(clientName);

    // (c) Detail: progress, milestone creation, milestone completion.
    await card.getByRole("link", { name: projectTitle }).click();
    await expect(
      page.getByRole("heading", { name: projectTitle, level: 1 }),
    ).toBeVisible({ timeout: 30_000 });

    const slider = page.getByLabel("Project progress");
    await expect(slider).toBeVisible();
    await slider.focus();
    for (let step = 0; step < 60; step += 1) {
      await slider.press("ArrowRight");
    }
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("60% saved")).toBeVisible({ timeout: 30_000 });

    const milestonesSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Milestones" }),
    });
    await milestonesSection.getByRole("button", { name: "Add" }).click();
    const milestoneDialog = page.getByRole("dialog", { name: "New milestone" });
    await expect(milestoneDialog).toBeVisible();
    await milestoneDialog.getByLabel("Title").fill(milestoneTitle);
    await milestoneDialog.getByLabel("Due date").fill(dateIn(7));
    await milestoneDialog.getByLabel("Status").selectOption("in_progress");
    await milestoneDialog.getByRole("button", { name: "Add milestone" }).click();
    await expect(milestoneDialog).toHaveCount(0, { timeout: 30_000 });

    const milestoneRow = page.locator("li").filter({ hasText: milestoneTitle });
    await expect(milestoneRow).toBeVisible({ timeout: 30_000 });
    // The dialog's status pick is applied through setProjectMilestoneStatus.
    await expect(milestoneRow.getByRole("combobox")).toHaveValue("in_progress");

    // Per-row status select (blocked) then the quick complete toggle.
    await milestoneRow.getByRole("combobox").selectOption("blocked");
    await expect(milestoneRow.getByRole("combobox")).toHaveValue("blocked", {
      timeout: 30_000,
    });

    await milestoneRow
      .getByRole("button", { name: `Complete ${milestoneTitle}` })
      .click();
    await expect(milestoneRow.getByRole("combobox")).toHaveValue("completed", {
      timeout: 30_000,
    });
    await expect(milestoneRow.locator("p").first()).toHaveClass(/line-through/);

    // (d) Search filters the list down to the new project.
    await page.goto("/portfolio");
    const search = page.getByPlaceholder(/Search projects/);
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.fill(projectTitle);
    await expect(card).toBeVisible();
    await expect(
      page.getByRole("link", { name: "LikasLens", exact: true }),
    ).toHaveCount(0);
    await search.fill("");

    // (e) Edit: maintenance + active retainer at ₱2,500/month.
    await card.getByRole("link", { name: projectTitle }).click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit project" });
    await expect(editDialog.getByLabel("Title")).toHaveValue(projectTitle);
    // The linked-task-list select is fed by getProjects(activeWorkspaceId).
    await expect
      .poll(
        async () =>
          editDialog.getByLabel("Linked task list").locator("option").count(),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(1);
    await editDialog.getByLabel("Portfolio status").selectOption("maintenance");
    await editDialog.getByLabel("Status", { exact: true }).selectOption("active");
    await editDialog.getByLabel("Monthly amount").fill("2500");
    await editDialog.getByRole("button", { name: "Save changes" }).click();
    await expect(editDialog).toHaveCount(0, { timeout: 30_000 });

    await page.goto("/portfolio");
    const editedCard = page.locator("article").filter({ hasText: projectTitle });
    await expect(editedCard).toContainText("Maintenance", {
      timeout: 30_000,
    });
    await expect(editedCard).toContainText("₱2,500");

    // (f) Archive. Observed (and intended) behaviour: the list query has no
    // status filter, so archived projects stay visible in the default view with
    // their Archived badge, sorted last.
    await editedCard.getByRole("link", { name: projectTitle }).click();
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    const confirm = page
      .getByRole("dialog")
      .filter({ hasText: "Archive project?" });
    await confirm.getByRole("button", { name: "Archive", exact: true }).click();
    await expect(page).toHaveURL(/\/portfolio$/, { timeout: 30_000 });

    const archivedCard = page
      .locator("article")
      .filter({ hasText: projectTitle });
    await expect(archivedCard).toBeVisible({ timeout: 30_000 });
    await expect(archivedCard).toContainText("Archived");
  });
});
