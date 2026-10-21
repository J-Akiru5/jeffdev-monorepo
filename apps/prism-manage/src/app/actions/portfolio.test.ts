import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lightweight server-action tests with a mocked Supabase surface.
 * Deliberately does NOT test PostgREST itself: it covers the RBAC gates and
 * the write payload shape that the UI depends on.
 */

interface QueryResult {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
}

interface PlanContext {
  table: string;
  op: string;
  filters: Record<string, unknown>;
  payload?: unknown;
  count?: string;
  head?: boolean;
}

const h = vi.hoisted(() => ({
  plan: (() => ({ data: null, error: null, count: 0 })) as (context: PlanContext) => QueryResult,
  user: { id: "user-founder" } as { id: string } | null,
  notify: vi.fn<(...args: unknown[]) => Promise<void>>(async () => undefined),
  revalidate: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => h.revalidate(...args),
}));

vi.mock("@/lib/notify", () => ({
  notifyUsers: (...args: unknown[]) => h.notify(...args),
}));

vi.mock("@/lib/log", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/**
 * Minimal chainable/thenable PostgREST stand-in. Every terminal
 * (`single`, `maybeSingle`, `await builder`) funnels through `h.plan`.
 */
function makeBuilder(
  table: string,
  op = "select",
  payload?: unknown,
  options?: Record<string, unknown>,
) {
  const filters: Record<string, unknown> = {};
  let countOptions: { count?: string; head?: boolean } = {};
  const run = () => h.plan({ table, op, filters, payload, ...countOptions });

  const builder = {
    select: (_columns?: string, opts?: { count?: string; head?: boolean }) => {
      if (opts) countOptions = { ...countOptions, ...opts };
      return builder;
    },
    insert: (values: unknown) => makeBuilder(table, "insert", values, options),
    update: (values: unknown) => makeBuilder(table, "update", values, options),
    upsert: (values: unknown, opts?: Record<string, unknown>) =>
      makeBuilder(table, "upsert", values, opts),
    delete: () => makeBuilder(table, "delete", undefined, options),
    eq: (column: string, value: unknown) => {
      filters[column] = value;
      return builder;
    },
    neq: (column: string, value: unknown) => {
      filters[`neq:${column}`] = value;
      return builder;
    },
    in: (column: string, values: unknown[]) => {
      filters[`in:${column}`] = values;
      return builder;
    },
    order: () => builder,
    limit: () => builder,
    maybeSingle: async () => run(),
    single: async () => run(),
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(run()).then(resolve, reject),
  };

  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from: (table: string) => makeBuilder(table),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => ({ from: (table: string) => makeBuilder(table) }),
}));

import {
  createPartner,
  createPortfolioProject,
  updatePartner,
  updatePortfolioProject,
  updatePortfolioProgress,
} from "./portfolio";

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";
const PARTNER_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const LIST_ID = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  h.user = { id: "user-founder" };
  h.plan = () => ({ data: null, error: null, count: 0 });
  h.notify.mockClear();
  h.revalidate.mockClear();
});

describe("founder guard", () => {
  it("rejects a non-founder before any write", async () => {
    const inserted: unknown[] = [];
    h.plan = ({ table, op, payload }) => {
      if (table === "workspace_members") return { data: null, error: null };
      if (op === "insert") inserted.push({ table, payload });
      return { data: null, error: null };
    };

    const result = await createPartner({ name: "Zenlabs" });

    expect(result.error).toBe("Only founders can manage the portfolio");
    expect(inserted).toEqual([]);
  });

  it("allows a founder to create a partner", async () => {
    h.plan = ({ table, op }) => {
      if (table === "workspace_members") return { data: { role: "founder" }, error: null };
      if (table === "partners" && op === "insert") {
        return { data: { id: "partner-new" }, error: null };
      }
      return { data: null, error: null };
    };

    const result = await createPartner({
      name: "MDM Events Management",
      kind: "events",
      email: "hello@mdm.example",
    });

    expect(result).toEqual({ success: true, id: "partner-new" });
    expect(h.revalidate).toHaveBeenCalledWith("/portfolio");
  });
});

describe("updatePortfolioProgress", () => {
  it("allows an assigned employee to update progress", async () => {
    h.user = { id: "member-1" };
    const updates: unknown[] = [];

    h.plan = ({ table, op, payload, filters }) => {
      if (table === "workspace_members") {
        return { data: filters.role === "founder" ? null : { role: "employee" }, error: null };
      }
      if (table === "project_members" && op === "select") {
        return { data: { user_id: "member-1" }, error: null };
      }
      if (table === "projects" && op === "update") {
        updates.push(payload);
        return { data: [{ id: "project-1" }], error: null };
      }
      return { data: null, error: null };
    };

    const result = await updatePortfolioProgress("project-1", 55);

    expect(result).toEqual({ success: true });
    expect(updates).toEqual([{ progress: 55 }]);
  });

  it("denies an employee who is not assigned to the project", async () => {
    h.user = { id: "member-2" };
    const updates: unknown[] = [];

    h.plan = ({ table, op, payload, filters }) => {
      if (table === "workspace_members") {
        return { data: filters.role === "founder" ? null : { role: "employee" }, error: null };
      }
      if (table === "project_members" && op === "select") return { data: null, error: null };
      if (table === "projects" && op === "update") updates.push(payload);
      return { data: null, error: null };
    };

    const result = await updatePortfolioProgress("project-1", 55);

    expect(result.error).toMatch(/assigned to this project/);
    expect(updates).toEqual([]);
  });

  it("rejects an out-of-range value before touching the database", async () => {
    const result = await updatePortfolioProgress("project-1", 140);
    expect(result.error).toBe("Progress must be an integer from 0 to 100");
  });
});

describe("updatePortfolioProject payload", () => {
  it("only writes the fields the caller supplied (no schema defaults)", async () => {
    h.user = { id: "founder-1" };
    const updates: unknown[] = [];

    h.plan = ({ table, op, payload }) => {
      if (table === "workspace_members") return { data: { role: "founder" }, error: null };
      if (table === "projects" && op === "select") {
        return {
          data: {
            id: "project-1",
            title: "Old title",
            slug: "old-title",
            metadata: { category: "AgriTech" },
          },
          error: null,
        };
      }
      if (table === "projects" && op === "update") {
        updates.push(payload);
        return { data: [{ id: "project-1" }], error: null };
      }
      return { data: null, error: null };
    };

    const result = await updatePortfolioProject("project-1", { title: "New title" });

    expect(result).toEqual({ success: true });
    expect(updates).toEqual([{ title: "New title" }]);
  });
});

describe("updatePartner payload", () => {
  it("does not reset kind/status when they are omitted", async () => {
    h.user = { id: "founder-1" };
    const updates: unknown[] = [];

    h.plan = ({ table, op, payload }) => {
      if (table === "workspace_members") return { data: { role: "founder" }, error: null };
      if (table === "partners" && op === "update") {
        updates.push(payload);
        return { data: [{ id: "partner-1" }], error: null };
      }
      return { data: null, error: null };
    };

    const result = await updatePartner("partner-1", { name: "Zenlabs" });

    expect(result).toEqual({ success: true });
    expect(updates).toEqual([{ name: "Zenlabs" }]);
  });
});

describe("createPortfolioProject payload", () => {
  it("writes mapped status, metadata, retainer and junction rows", async () => {
    h.user = { id: "founder-1" };
    const inserts: Array<{ table: string; payload: unknown }> = [];

    h.plan = ({ table, op, payload }) => {
      if (table === "workspace_members") return { data: { role: "founder" }, error: null };
      if (table === "partners" && op === "select") {
        return { data: [{ id: PARTNER_ID }], error: null };
      }
      if (table === "user_profiles" && op === "select") {
        return { data: [{ id: MEMBER_ID }], error: null };
      }
      if (table === "clients") return { data: { id: CLIENT_ID }, error: null };
      if (table === "pm_projects") return { data: { id: LIST_ID }, error: null };
      if (table === "projects" && op === "select") return { data: null, error: null };
      if (table === "projects" && op === "insert") {
        inserts.push({ table, payload });
        return { data: { id: "project-new" }, error: null };
      }
      if (op === "insert" && (table === "project_partners" || table === "project_members")) {
        inserts.push({ table, payload });
        return { data: null, error: null };
      }
      return { data: null, error: null };
    };

    const result = await createPortfolioProject({
      title: "Golf Management System",
      kind: "venture",
      portfolioStatus: "planning",
      description: "Golf club operations platform.",
      clientId: CLIENT_ID,
      category: "SaaS / Sports Operations",
      progress: 15,
      startDate: "2026-10-01",
      budget: 250000,
      retainerStatus: "active",
      retainerMonthlyAmount: 4500,
      retainerCurrency: "php",
      retainerRenewsOn: "2026-11-12",
      taskListId: LIST_ID,
      partners: [{ partnerId: PARTNER_ID, role: "co-development" }],
      members: [{ userId: MEMBER_ID, role: "lead" }],
    });

    expect(result).toEqual({ success: true, id: "project-new" });

    const projectInsert = inserts.find((entry) => entry.table === "projects")?.payload as Record<
      string,
      unknown
    >;
    expect(projectInsert).toMatchObject({
      user_id: "founder-1",
      title: "Golf Management System",
      slug: "golf-management-system",
      kind: "venture",
      portfolio_status: "planning",
      status: "active",
      client_id: CLIENT_ID,
      progress: 15,
      retainer_status: "active",
      retainer_monthly_amount: 4500,
      retainer_currency: "PHP",
      retainer_renews_on: "2026-11-12",
      start_date: "2026-10-01",
      budget: 250000,
      pm_project_id: LIST_ID,
      published: false,
    });
    expect(projectInsert.metadata).toEqual({ category: "SaaS / Sports Operations" });

    const partnerInsert = inserts.find((entry) => entry.table === "project_partners")
      ?.payload as Array<Record<string, unknown>>;
    expect(partnerInsert).toEqual([
      {
        project_id: "project-new",
        partner_id: PARTNER_ID,
        role: "co-development",
        created_by: "founder-1",
      },
    ]);

    const memberInsert = inserts.find((entry) => entry.table === "project_members")
      ?.payload as Array<Record<string, unknown>>;
    expect(memberInsert).toEqual([
      {
        project_id: "project-new",
        user_id: MEMBER_ID,
        role: "lead",
        created_by: "founder-1",
      },
    ]);
  });
});
