/**
 * Portfolio tracker — pure domain helpers
 * ---------------------------------------
 * No Supabase imports and no React: the shared types, the row mapper, the
 * filter/summary helpers and the RBAC predicates used by `actions/portfolio.ts`
 * and the Portfolio UI. Everything here is deterministic and unit-tested.
 */

// =============================================================================
// TYPES
// =============================================================================

export type PortfolioKind = "venture" | "client" | "internal";

export type PortfolioStatus =
  | "planning"
  | "in_progress"
  | "maintenance"
  | "completed"
  | "paused"
  | "archived";

/** The public site's 4-state `projects.status` contract. */
export type PublicProjectStatus = "active" | "paused" | "completed" | "archived";

export type RetainerStatus = "none" | "active" | "paused" | "ended";

export type PartnerKind = "agency" | "product" | "events" | "infrastructure" | "other";

export type MemberRole =
  | "lead"
  | "developer"
  | "designer"
  | "qa"
  | "marketing"
  | "support"
  | "contributor";

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface PortfolioPartnerLink {
  id: string;
  name: string;
  kind: PartnerKind;
  role: string | null;
}

export interface PortfolioMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: MemberRole;
}

export interface PortfolioRetainer {
  status: RetainerStatus;
  monthlyAmount: number | null;
  currency: string;
  startedOn: string | null;
  renewsOn: string | null;
}

export interface PortfolioProjectSummary {
  id: string;
  title: string;
  slug: string | null;
  kind: PortfolioKind;
  portfolioStatus: PortfolioStatus;
  publicStatus: PublicProjectStatus;
  progress: number | null;
  description: string | null;
  category: string | null;
  client: { id: string; name: string; company: string | null } | null;
  partners: PortfolioPartnerLink[];
  members: PortfolioMember[];
  retainer: PortfolioRetainer;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  budgetSpent: number | null;
  published: boolean;
  publishedSiteUrl: string | null;
  taskListId: string | null;
  taskListName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStats {
  total: number;
  ventures: number;
  clients: number;
  maintenance: number;
  completed: number;
  /** Active retainer MRR grouped by currency (e.g. `{ PHP: 4500 }`). */
  activeMrr: Record<string, number>;
}

export interface PortfolioFilters {
  kind?: PortfolioKind;
  portfolioStatus?: PortfolioStatus;
  retainerStatus?: RetainerStatus;
  partnerId?: string;
  memberId?: string;
  search?: string;
}

export interface PortfolioMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioTaskCounts {
  open: number;
  completed: number;
}

export interface PortfolioProjectDetail extends PortfolioProjectSummary {
  milestones: PortfolioMilestone[];
  taskCounts: PortfolioTaskCounts;
}

export interface PortfolioPartnerSummary {
  id: string;
  name: string;
  kind: PartnerKind;
  status: "active" | "inactive";
}

export interface PortfolioDashboardData {
  projects: PortfolioProjectSummary[];
  stats: PortfolioStats;
  partners: PortfolioPartnerSummary[];
}

export interface PortfolioActionResult {
  success?: boolean;
  error?: string;
  id?: string;
}

// =============================================================================
// NORMALISERS
// =============================================================================

const PORTFOLIO_KINDS: readonly PortfolioKind[] = ["venture", "client", "internal"];
const PORTFOLIO_STATUSES: readonly PortfolioStatus[] = [
  "planning",
  "in_progress",
  "maintenance",
  "completed",
  "paused",
  "archived",
];
const RETAINER_STATUSES: readonly RetainerStatus[] = ["none", "active", "paused", "ended"];
const PARTNER_KINDS: readonly PartnerKind[] = [
  "agency",
  "product",
  "events",
  "infrastructure",
  "other",
];
const MEMBER_ROLES: readonly MemberRole[] = [
  "lead",
  "developer",
  "designer",
  "qa",
  "marketing",
  "support",
  "contributor",
];
const MILESTONE_STATUSES: readonly MilestoneStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "blocked",
];

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Many-to-one joins come back as an object, but tolerate a one-item array. */
function firstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const record = asRecord(item);
      if (record) return record;
    }
    return null;
  }
  return asRecord(value);
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > 0 ? text : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toMetadata(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value)) ?? {};
    } catch {
      return {};
    }
  }
  return asRecord(value) ?? {};
}

export function normalizePortfolioKind(value: unknown): PortfolioKind {
  return isOneOf(value, PORTFOLIO_KINDS) ? value : "client";
}

export function normalizePortfolioStatus(value: unknown): PortfolioStatus {
  // The DB default is 'in_progress' (see the migration note: the plan's
  // literal 'active' default is not a member of the approved status set).
  return isOneOf(value, PORTFOLIO_STATUSES) ? value : "in_progress";
}

export function normalizeRetainerStatus(value: unknown): RetainerStatus {
  return isOneOf(value, RETAINER_STATUSES) ? value : "none";
}

export function normalizePartnerKind(value: unknown): PartnerKind {
  return isOneOf(value, PARTNER_KINDS) ? value : "other";
}

export function normalizeMemberRole(value: unknown): MemberRole {
  return isOneOf(value, MEMBER_ROLES) ? value : "contributor";
}

export function normalizeMilestoneStatus(value: unknown): MilestoneStatus {
  return isOneOf(value, MILESTONE_STATUSES) ? value : "pending";
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * planning / in_progress / maintenance -> active; the public site only knows
 * the four states in `projects.status`. Written by the actions; never
 * dual-written by the UI.
 */
export function publicStatusFor(portfolioStatus: PortfolioStatus): PublicProjectStatus {
  switch (portfolioStatus) {
    case "completed":
      return "completed";
    case "paused":
      return "paused";
    case "archived":
      return "archived";
    default:
      return "active";
  }
}

/**
 * Map a joined Supabase row (snake_case + nested joins) to the camelCase
 * summary the Portfolio UI consumes. Tolerates missing joins and partially
 * populated rows; `progress` falls back to `metadata.progress` when the real
 * column is null.
 */
export function mapPortfolioProject(row: Record<string, unknown>): PortfolioProjectSummary {
  const metadata = toMetadata(row.metadata);
  const portfolioStatus = normalizePortfolioStatus(row.portfolio_status);

  const clientRow = firstRecord(row.clients);
  const client =
    clientRow && clientRow.id
      ? {
          id: String(clientRow.id),
          name: String(clientRow.name ?? ""),
          company: toStringOrNull(clientRow.company),
        }
      : null;

  const partners: PortfolioPartnerLink[] = [];
  for (const entry of asArray(row.project_partners)) {
    const junction = asRecord(entry);
    if (!junction) continue;
    const partner = firstRecord(junction.partners);
    if (!partner || !partner.id) continue;
    partners.push({
      id: String(partner.id),
      name: String(partner.name ?? ""),
      kind: normalizePartnerKind(partner.kind),
      role: toStringOrNull(junction.role),
    });
  }

  const members: PortfolioMember[] = [];
  for (const entry of asArray(row.project_members)) {
    const junction = asRecord(entry);
    if (!junction) continue;
    const profile = firstRecord(junction.user_profiles);
    const userId = profile?.id ?? junction.user_id;
    if (!userId) continue;
    members.push({
      userId: String(userId),
      name: toStringOrNull(profile?.full_name) ?? "Unknown member",
      avatarUrl: toStringOrNull(profile?.avatar_url),
      role: normalizeMemberRole(junction.role),
    });
  }

  const taskList = firstRecord(row.pm_projects);
  const taskListId = taskList?.id ? String(taskList.id) : toStringOrNull(row.pm_project_id);

  const retainer: PortfolioRetainer = {
    status: normalizeRetainerStatus(row.retainer_status),
    monthlyAmount: toNumberOrNull(row.retainer_monthly_amount),
    currency: toStringOrNull(row.retainer_currency) ?? "PHP",
    startedOn: toStringOrNull(row.retainer_started_on),
    renewsOn: toStringOrNull(row.retainer_renews_on),
  };

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    slug: toStringOrNull(row.slug),
    kind: normalizePortfolioKind(row.kind),
    portfolioStatus,
    publicStatus: publicStatusFor(portfolioStatus),
    progress: toNumberOrNull(row.progress) ?? toNumberOrNull(metadata.progress),
    description: toStringOrNull(row.description),
    category: toStringOrNull(metadata.category),
    client,
    partners,
    members,
    retainer,
    startDate: toStringOrNull(row.start_date),
    endDate: toStringOrNull(row.end_date),
    budget: toNumberOrNull(row.budget),
    budgetSpent: toNumberOrNull(row.budget_spent),
    published: row.published === true,
    publishedSiteUrl: toStringOrNull(row.published_site_url),
    taskListId,
    taskListName: taskList ? toStringOrNull(taskList.name) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

// =============================================================================
// FILTERS + SUMMARY
// =============================================================================

function searchableText(project: PortfolioProjectSummary): string {
  const parts = [
    project.title,
    project.slug ?? "",
    project.description ?? "",
    project.category ?? "",
    project.client?.name ?? "",
    project.client?.company ?? "",
    project.taskListName ?? "",
    ...project.partners.map((partner) => partner.name),
    ...project.members.map((member) => member.name),
  ];
  return parts.join(" ").toLowerCase();
}

/** All filters are AND-ed; an absent field matches everything. */
export function matchesPortfolioFilters(
  project: PortfolioProjectSummary,
  filters: PortfolioFilters,
): boolean {
  if (filters.kind && project.kind !== filters.kind) return false;
  if (filters.portfolioStatus && project.portfolioStatus !== filters.portfolioStatus) {
    return false;
  }
  if (filters.retainerStatus && project.retainer.status !== filters.retainerStatus) {
    return false;
  }
  if (filters.partnerId && !project.partners.some((partner) => partner.id === filters.partnerId)) {
    return false;
  }
  if (filters.memberId && !project.members.some((member) => member.userId === filters.memberId)) {
    return false;
  }

  const search = filters.search?.trim().toLowerCase();
  if (search && !searchableText(project).includes(search)) return false;

  return true;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizePortfolio(projects: PortfolioProjectSummary[]): PortfolioStats {
  const stats: PortfolioStats = {
    total: projects.length,
    ventures: 0,
    clients: 0,
    maintenance: 0,
    completed: 0,
    activeMrr: {},
  };

  for (const project of projects) {
    if (project.kind === "venture") stats.ventures += 1;
    if (project.kind === "client") stats.clients += 1;
    if (project.portfolioStatus === "maintenance") stats.maintenance += 1;
    if (project.portfolioStatus === "completed") stats.completed += 1;

    const amount = project.retainer.monthlyAmount;
    if (project.retainer.status === "active" && amount !== null && amount > 0) {
      const currency = project.retainer.currency || "PHP";
      stats.activeMrr[currency] = roundCurrency((stats.activeMrr[currency] ?? 0) + amount);
    }
  }

  return stats;
}

/**
 * Founder-only commercial figures. Non-founder viewers receive the project
 * with amounts removed — counts, statuses, dates and assignees stay visible.
 */
export function redactPortfolioAmounts(
  project: PortfolioProjectSummary,
): PortfolioProjectSummary {
  return {
    ...project,
    budget: null,
    budgetSpent: null,
    retainer: { ...project.retainer, monthlyAmount: null },
  };
}

export function retainerLabel(retainerStatus: RetainerStatus): string {
  switch (retainerStatus) {
    case "active":
      return "Active retainer";
    case "paused":
      return "Retainer paused";
    case "ended":
      return "Retainer ended";
    default:
      return "No retainer";
  }
}

/**
 * Whole days from today to the renewal date (negative when overdue).
 * Date-only values are compared in UTC so a local timezone cannot shift the
 * count by one. Returns null for a missing or invalid date.
 */
export function daysUntilRenewal(
  renewsOn: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!renewsOn) return null;

  let renewalMs: number;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(renewsOn.trim());
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    renewalMs = Date.UTC(year, month - 1, day);
    const probe = new Date(renewalMs);
    // Reject overflowed dates like 2026-02-31.
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() !== month - 1 ||
      probe.getUTCDate() !== day
    ) {
      return null;
    }
  } else {
    const parsed = new Date(renewsOn);
    if (Number.isNaN(parsed.getTime())) return null;
    renewalMs = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return Math.round((renewalMs - todayMs) / 86_400_000);
}

// =============================================================================
// SLUGS
// =============================================================================

/** URL-safe slug base. Collisions are resolved by the calling action. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// =============================================================================
// PERMISSIONS (pure — mirrored by the server actions)
// =============================================================================

export function canEditPortfolio(role: string | null | undefined): boolean {
  return role === "founder";
}

export function canUpdateProjectProgress(
  role: string | null | undefined,
  isAssigned: boolean,
): boolean {
  return role === "founder" || isAssigned;
}
