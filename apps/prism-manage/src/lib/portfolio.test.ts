import { describe, expect, it } from "vitest";
import {
  canEditPortfolio,
  canUpdateProjectProgress,
  daysUntilRenewal,
  mapPortfolioProject,
  matchesPortfolioFilters,
  publicStatusFor,
  redactPortfolioAmounts,
  retainerLabel,
  slugify,
  summarizePortfolio,
  type PortfolioProjectSummary,
} from "./portfolio";

const baseRow: Record<string, unknown> = {
  id: "project-1",
  title: "Golf Management System",
  slug: "golf-management-system",
  kind: "venture",
  portfolio_status: "planning",
  status: "active",
  progress: 40,
  description: "Golf club operations platform.",
  metadata: { category: "SaaS / Sports Operations", progress: 5 },
  clients: { id: "client-1", name: "Arena Club", company: "Arena Group" },
  project_partners: [
    {
      role: "co-development",
      partners: { id: "partner-1", name: "Zenlabs", kind: "product" },
    },
    {
      role: "events & venue partner",
      partners: { id: "partner-2", name: "MDM Events Management", kind: "events" },
    },
  ],
  project_members: [
    {
      role: "lead",
      user_id: "user-1",
      user_profiles: { id: "user-1", full_name: "Jeff", avatar_url: "https://x/y.png" },
    },
  ],
  pm_projects: { id: "list-1", name: "Golf Ops" },
  retainer_status: "active",
  retainer_monthly_amount: 4500,
  retainer_currency: "PHP",
  retainer_started_on: "2026-01-15",
  retainer_renews_on: "2026-11-12",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  budget: 120000,
  budget_spent: 30000,
  published: true,
  published_site_url: "https://example.com/work/golf",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

function project(overrides: Partial<PortfolioProjectSummary> = {}): PortfolioProjectSummary {
  return {
    ...mapPortfolioProject(baseRow),
    ...overrides,
  };
}

describe("redactPortfolioAmounts", () => {
  it("removes commercial amounts but keeps status, dates and assignees", () => {
    const mapped = mapPortfolioProject(baseRow);
    const redacted = redactPortfolioAmounts(mapped);

    expect(redacted.budget).toBeNull();
    expect(redacted.budgetSpent).toBeNull();
    expect(redacted.retainer).toEqual({
      ...mapped.retainer,
      monthlyAmount: null,
    });
    expect(redacted.portfolioStatus).toBe(mapped.portfolioStatus);
    expect(redacted.members).toHaveLength(mapped.members.length);
  });

  it("yields no MRR when the list is redacted", () => {
    const redacted = [redactPortfolioAmounts(mapPortfolioProject(baseRow))];
    expect(summarizePortfolio(redacted).activeMrr).toEqual({});
  });
});

describe("mapPortfolioProject", () => {
  it("maps a fully joined row", () => {
    const mapped = mapPortfolioProject(baseRow);

    expect(mapped.id).toBe("project-1");
    expect(mapped.title).toBe("Golf Management System");
    expect(mapped.slug).toBe("golf-management-system");
    expect(mapped.kind).toBe("venture");
    expect(mapped.portfolioStatus).toBe("planning");
    expect(mapped.publicStatus).toBe("active");
    expect(mapped.progress).toBe(40);
    expect(mapped.category).toBe("SaaS / Sports Operations");
    expect(mapped.client).toEqual({
      id: "client-1",
      name: "Arena Club",
      company: "Arena Group",
    });
    expect(mapped.partners).toEqual([
      { id: "partner-1", name: "Zenlabs", kind: "product", role: "co-development" },
      {
        id: "partner-2",
        name: "MDM Events Management",
        kind: "events",
        role: "events & venue partner",
      },
    ]);
    expect(mapped.members).toEqual([
      {
        userId: "user-1",
        name: "Jeff",
        avatarUrl: "https://x/y.png",
        role: "lead",
      },
    ]);
    expect(mapped.retainer).toEqual({
      status: "active",
      monthlyAmount: 4500,
      currency: "PHP",
      startedOn: "2026-01-15",
      renewsOn: "2026-11-12",
    });
    expect(mapped.taskListId).toBe("list-1");
    expect(mapped.taskListName).toBe("Golf Ops");
    expect(mapped.budget).toBe(120000);
    expect(mapped.budgetSpent).toBe(30000);
    expect(mapped.published).toBe(true);
    expect(mapped.publishedSiteUrl).toBe("https://example.com/work/golf");
    expect(mapped.startDate).toBe("2026-01-01");
    expect(mapped.endDate).toBe("2026-12-31");
  });

  it("falls back to metadata.progress when the column is null", () => {
    const mapped = mapPortfolioProject({ ...baseRow, progress: null });
    expect(mapped.progress).toBe(5);
  });

  it("parses metadata stored as a JSON string", () => {
    const mapped = mapPortfolioProject({
      ...baseRow,
      progress: null,
      metadata: JSON.stringify({ category: "AgriTech", progress: 72 }),
    });
    expect(mapped.progress).toBe(72);
    expect(mapped.category).toBe("AgriTech");
  });

  it("survives missing joins and null optional fields", () => {
    const mapped = mapPortfolioProject({
      id: "project-2",
      title: "LikasLens",
      slug: "likaslens",
      kind: null,
      portfolio_status: null,
      metadata: null,
      clients: null,
      project_partners: null,
      project_members: undefined,
      pm_projects: null,
      retainer_status: null,
      retainer_monthly_amount: null,
      retainer_currency: null,
      retainer_started_on: null,
      retainer_renews_on: null,
      start_date: null,
      end_date: null,
      budget: null,
      budget_spent: null,
      published: null,
      published_site_url: null,
      pm_project_id: null,
      created_at: "2026-02-01T00:00:00.000Z",
      updated_at: "2026-02-01T00:00:00.000Z",
    });

    expect(mapped.kind).toBe("client");
    expect(mapped.portfolioStatus).toBe("in_progress");
    expect(mapped.progress).toBeNull();
    expect(mapped.category).toBeNull();
    expect(mapped.client).toBeNull();
    expect(mapped.partners).toEqual([]);
    expect(mapped.members).toEqual([]);
    expect(mapped.taskListId).toBeNull();
    expect(mapped.taskListName).toBeNull();
    expect(mapped.retainer).toEqual({
      status: "none",
      monthlyAmount: null,
      currency: "PHP",
      startedOn: null,
      renewsOn: null,
    });
    expect(mapped.published).toBe(false);
  });

  it("keeps a member assignment when the profile join is missing", () => {
    const mapped = mapPortfolioProject({
      ...baseRow,
      project_members: [{ role: "qa", user_id: "user-9", user_profiles: null }],
    });
    expect(mapped.members).toEqual([
      { userId: "user-9", name: "Unknown member", avatarUrl: null, role: "qa" },
    ]);
  });

  it("accepts a many-to-one join returned as a one-item array", () => {
    const mapped = mapPortfolioProject({
      ...baseRow,
      clients: [{ id: "client-1", name: "Arena Club", company: null }],
      pm_projects: [{ id: "list-1", name: "Golf Ops" }],
    });
    expect(mapped.client?.name).toBe("Arena Club");
    expect(mapped.taskListName).toBe("Golf Ops");
  });
});

describe("publicStatusFor", () => {
  it("maps tracker statuses onto the public site's four states", () => {
    expect(publicStatusFor("planning")).toBe("active");
    expect(publicStatusFor("in_progress")).toBe("active");
    expect(publicStatusFor("maintenance")).toBe("active");
    expect(publicStatusFor("completed")).toBe("completed");
    expect(publicStatusFor("paused")).toBe("paused");
    expect(publicStatusFor("archived")).toBe("archived");
  });
});

describe("matchesPortfolioFilters", () => {
  const golf = project();

  it("matches everything when no filters are set", () => {
    expect(matchesPortfolioFilters(golf, {})).toBe(true);
  });

  it("filters by kind", () => {
    expect(matchesPortfolioFilters(golf, { kind: "venture" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { kind: "client" })).toBe(false);
  });

  it("filters by portfolio status", () => {
    expect(matchesPortfolioFilters(golf, { portfolioStatus: "planning" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { portfolioStatus: "maintenance" })).toBe(false);
  });

  it("filters by retainer status", () => {
    expect(matchesPortfolioFilters(golf, { retainerStatus: "active" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { retainerStatus: "ended" })).toBe(false);
  });

  it("filters by partner id", () => {
    expect(matchesPortfolioFilters(golf, { partnerId: "partner-2" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { partnerId: "partner-9" })).toBe(false);
  });

  it("filters by assigned member id", () => {
    expect(matchesPortfolioFilters(golf, { memberId: "user-1" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { memberId: "user-2" })).toBe(false);
  });

  it("ANDs multiple filters", () => {
    expect(matchesPortfolioFilters(golf, { kind: "venture", memberId: "user-1" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { kind: "venture", partnerId: "partner-9" })).toBe(false);
  });

  it("searches title, client, category and partners case-insensitively", () => {
    expect(matchesPortfolioFilters(golf, { search: "GOLF" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { search: "arena" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { search: "saas" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { search: "zenlabs" })).toBe(true);
    expect(matchesPortfolioFilters(golf, { search: "riceconnect" })).toBe(false);
  });

  it("ignores a blank search term", () => {
    expect(matchesPortfolioFilters(golf, { search: "   " })).toBe(true);
  });
});

describe("summarizePortfolio", () => {
  it("counts kinds/statuses and groups active MRR by currency", () => {
    const projects = [
      project({
        kind: "venture",
        portfolioStatus: "maintenance",
        retainer: {
          status: "active",
          monthlyAmount: 4500,
          currency: "PHP",
          startedOn: null,
          renewsOn: null,
        },
      }),
      project({
        id: "p2",
        kind: "client",
        portfolioStatus: "completed",
        retainer: {
          status: "active",
          monthlyAmount: 500,
          currency: "USD",
          startedOn: null,
          renewsOn: null,
        },
      }),
      project({
        id: "p3",
        kind: "client",
        portfolioStatus: "paused",
        retainer: {
          status: "paused",
          monthlyAmount: 9999,
          currency: "PHP",
          startedOn: null,
          renewsOn: null,
        },
      }),
      project({
        id: "p4",
        kind: "internal",
        portfolioStatus: "in_progress",
        retainer: {
          status: "active",
          monthlyAmount: 1500.555,
          currency: "PHP",
          startedOn: null,
          renewsOn: null,
        },
      }),
      project({
        id: "p5",
        kind: "client",
        portfolioStatus: "archived",
        retainer: {
          status: "active",
          monthlyAmount: null,
          currency: "PHP",
          startedOn: null,
          renewsOn: null,
        },
      }),
    ];

    const stats = summarizePortfolio(projects);
    expect(stats.total).toBe(5);
    expect(stats.ventures).toBe(1);
    expect(stats.clients).toBe(3);
    expect(stats.maintenance).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.activeMrr).toEqual({ PHP: 6000.56, USD: 500 });
  });

  it("returns zeroed stats for an empty portfolio", () => {
    expect(summarizePortfolio([])).toEqual({
      total: 0,
      ventures: 0,
      clients: 0,
      maintenance: 0,
      completed: 0,
      activeMrr: {},
    });
  });
});

describe("retainerLabel", () => {
  it("labels every retainer state", () => {
    expect(retainerLabel("none")).toBe("No retainer");
    expect(retainerLabel("active")).toBe("Active retainer");
    expect(retainerLabel("paused")).toBe("Retainer paused");
    expect(retainerLabel("ended")).toBe("Retainer ended");
  });
});

describe("daysUntilRenewal", () => {
  const now = new Date("2026-10-22T15:30:00.000Z");

  it("counts future days", () => {
    expect(daysUntilRenewal("2026-10-29", now)).toBe(7);
  });

  it("returns 0 for today", () => {
    expect(daysUntilRenewal("2026-10-22", now)).toBe(0);
  });

  it("returns a negative count for an overdue renewal", () => {
    expect(daysUntilRenewal("2026-10-15", now)).toBe(-7);
  });

  it("returns null for missing or invalid dates", () => {
    expect(daysUntilRenewal(null, now)).toBeNull();
    expect(daysUntilRenewal(undefined, now)).toBeNull();
    expect(daysUntilRenewal("", now)).toBeNull();
    expect(daysUntilRenewal("not-a-date", now)).toBeNull();
    expect(daysUntilRenewal("2026-02-31", now)).toBeNull();
  });
});

describe("permission helpers", () => {
  it("only founders may edit the portfolio", () => {
    expect(canEditPortfolio("founder")).toBe(true);
    expect(canEditPortfolio("employee")).toBe(false);
    expect(canEditPortfolio(null)).toBe(false);
    expect(canEditPortfolio(undefined)).toBe(false);
  });

  it("founders or the assigned member may update progress", () => {
    expect(canUpdateProjectProgress("founder", false)).toBe(true);
    expect(canUpdateProjectProgress("employee", true)).toBe(true);
    expect(canUpdateProjectProgress("employee", false)).toBe(false);
    expect(canUpdateProjectProgress(null, false)).toBe(false);
  });
});

describe("slugify", () => {
  it("derives URL-safe slug bases", () => {
    expect(slugify("Golf Management System")).toBe("golf-management-system");
    expect(slugify("  LikasLens — AI  ")).toBe("likaslens-ai");
    expect(slugify("!!!")).toBe("");
  });
});
