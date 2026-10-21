"use server";

/**
 * Portfolio tracker server actions (Phase 1 · Agent A)
 * ---------------------------------------------------
 * Reads go through the service-role admin client so every workspace member
 * sees the same portfolio; writes also use the admin client (the new tables
 * intentionally have no write RLS policies) and are gated here:
 *
 *   - founders: edit projects, partners, assignments, retainer terms
 *   - founders + the project's assigned members: progress + milestones
 *   - any authenticated member: read
 *
 * Result convention matches the rest of the app: `{ success?, error?, id? }`
 * rather than throwing, because Next masks thrown server-action messages in
 * production.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- the generated Database
   types predate this migration; the admin client is cast loose for the new
   tables/columns until `pnpm db:types` runs (same pattern as actions/tasks.ts
   and actions/templates.ts). */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/log";
import { notifyUsers } from "@/lib/notify";
import {
  canEditPortfolio,
  canUpdateProjectProgress,
  mapPortfolioProject,
  matchesPortfolioFilters,
  normalizeMilestoneStatus,
  normalizePartnerKind,
  publicStatusFor,
  slugify,
  summarizePortfolio,
  type MilestoneStatus,
  type PortfolioDashboardData,
  type PortfolioFilters,
  type PortfolioMilestone,
  type PortfolioPartnerSummary,
  type PortfolioProjectDetail,
  type PortfolioProjectSummary,
  type PortfolioActionResult,
  redactPortfolioAmounts,
} from "@/lib/portfolio";
import type { Json } from "@/types/database.types";

// =============================================================================
// SCHEMAS
// =============================================================================

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const dateOnly = z.string().trim().regex(DATE_ONLY, "Use YYYY-MM-DD");

const portfolioKindSchema = z.enum(["venture", "client", "internal"]);
const portfolioStatusSchema = z.enum([
  "planning",
  "in_progress",
  "maintenance",
  "completed",
  "paused",
  "archived",
]);
const retainerStatusSchema = z.enum(["none", "active", "paused", "ended"]);
const partnerKindSchema = z.enum(["agency", "product", "events", "infrastructure", "other"]);
const memberRoleSchema = z.enum([
  "lead",
  "developer",
  "designer",
  "qa",
  "marketing",
  "support",
  "contributor",
]);
const milestoneStatusSchema = z.enum(["pending", "in_progress", "completed", "blocked"]);

const partnerRefSchema = z.object({
  partnerId: z.string().uuid(),
  role: z.string().trim().max(120).optional(),
});

const memberRefSchema = z.object({
  userId: z.string().uuid(),
  role: memberRoleSchema.default("contributor"),
});

const projectFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  slug: z.string().trim().max(120).optional(),
  kind: portfolioKindSchema.default("client"),
  portfolioStatus: portfolioStatusSchema.default("planning"),
  description: z.string().trim().max(5000).optional(),
  clientId: z.string().uuid().nullable().optional(),
  category: z.string().trim().max(80).optional(),
  progress: z.number().int().min(0).max(100).nullable().optional(),
  startDate: dateOnly.nullable().optional(),
  endDate: dateOnly.nullable().optional(),
  budget: z.number().min(0).max(1_000_000_000).nullable().optional(),
  retainerStatus: retainerStatusSchema.optional(),
  retainerMonthlyAmount: z.number().min(0).max(1_000_000_000).nullable().optional(),
  retainerCurrency: z.string().trim().min(1).max(8).optional(),
  retainerStartedOn: dateOnly.nullable().optional(),
  retainerRenewsOn: dateOnly.nullable().optional(),
  publishedSiteUrl: z.string().trim().max(2048).nullable().optional(),
  taskListId: z.string().uuid().nullable().optional(),
  partners: z.array(partnerRefSchema).max(50).optional(),
  members: z.array(memberRefSchema).max(100).optional(),
});

// NOTE: Zod v4 `.partial()` keeps a field's `.default()`, so the fields that
// carry a create-time default are re-declared as plain optional here.
// Otherwise a title-only update would silently reset kind/status.
const updateProjectSchema = projectFieldsSchema.partial().extend({
  kind: portfolioKindSchema.optional(),
  portfolioStatus: portfolioStatusSchema.optional(),
});

const createPartnerSchema = z.object({
  name: z.string().trim().min(1, "Partner name is required").max(120),
  kind: partnerKindSchema.default("agency"),
  contactName: z.string().trim().max(120).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(2048).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updatePartnerSchema = createPartnerSchema.partial().extend({
  kind: partnerKindSchema.optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const progressSchema = z.number().int().min(0).max(100);

const milestoneInputSchema = z.object({
  title: z.string().trim().min(1, "Milestone title is required").max(200),
  dueDate: dateOnly,
  description: z.string().trim().max(2000).optional(),
});

export type CreatePortfolioProjectInput = z.input<typeof projectFieldsSchema>;
export type UpdatePortfolioProjectInput = z.input<typeof updateProjectSchema>;
export type CreatePartnerInput = z.input<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.input<typeof updatePartnerSchema>;
export type CreateMilestoneInput = z.input<typeof milestoneInputSchema>;
export type ProjectMemberRole = z.infer<typeof memberRoleSchema>;

// =============================================================================
// SHARED HELPERS
// =============================================================================

type Db = any;

async function logAudit(event: {
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const supabaseAdmin = getAdminClient();
    await supabaseAdmin.from("audit_logs").insert({
      action: event.action,
      resource_type: event.resource,
      resource_id: event.resourceId,
      changes: (event.details ?? null) as Json,
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit is non-critical; never throw
  }
}

/**
 * Founder guard for portfolio writes. Looks for a founder membership in any
 * workspace (the app is single-workspace in practice). Returns `{ error }`
 * instead of throwing so the action can return it directly.
 */
async function requireFounder(supabase: Db, userId: string): Promise<{ error: string } | null> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "founder")
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Only founders can manage the portfolio" };
  return null;
}

async function getWorkspaceRole(supabase: Db, userId: string): Promise<string | null> {
  // Founder wins across workspaces: a user who is a founder anywhere must not
  // fall back to an employee role picked from another membership.
  const { data: founderRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "founder")
    .limit(1)
    .maybeSingle();
  if (founderRow) return "founder";

  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.role ? String(data.role) : null;
}

async function isProjectMember(admin: Db, projectId: string, userId: string): Promise<boolean> {
  const { data } = await admin
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Founder OR an assigned member of this project. Used for progress and
 * milestone writes (the plan's "assigned member" row).
 */
async function requireProjectEditor(
  supabase: Db,
  admin: Db,
  projectId: string,
  userId: string,
): Promise<{ error: string } | null> {
  const role = await getWorkspaceRole(supabase, userId);
  if (canEditPortfolio(role)) return null;

  const assigned = await isProjectMember(admin, projectId, userId);
  if (canUpdateProjectProgress(role, assigned)) return null;

  return { error: "Only founders or members assigned to this project can do that" };
}

async function uniqueSlug(admin: Db, base: string, excludeId: string | null): Promise<string> {
  const root = base || "project";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    let query = admin.from("projects").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

async function missingIds(
  admin: Db,
  table: "partners" | "user_profiles",
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const { data } = await admin.from(table).select("id").in("id", unique);
  const found = new Set(((data ?? []) as Record<string, unknown>[]).map((row) => String(row.id)));
  return unique.filter((id) => !found.has(id));
}

async function replaceProjectPartners(
  admin: Db,
  projectId: string,
  links: Array<{ partnerId: string; role?: string }>,
  userId: string,
): Promise<string | null> {
  const { error: deleteError } = await admin
    .from("project_partners")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) return deleteError.message;

  if (links.length === 0) return null;

  const byPartner = new Map<string, string | null>();
  for (const link of links) {
    byPartner.set(link.partnerId, link.role?.trim() || null);
  }

  const rows = [...byPartner.entries()].map(([partnerId, role]) => ({
    project_id: projectId,
    partner_id: partnerId,
    role,
    created_by: userId,
  }));

  const { error } = await admin.from("project_partners").insert(rows);
  return error?.message ?? null;
}

async function replaceProjectMembers(
  admin: Db,
  projectId: string,
  links: Array<{ userId: string; role: ProjectMemberRole }>,
  userId: string,
): Promise<string | null> {
  const { error: deleteError } = await admin
    .from("project_members")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) return deleteError.message;

  if (links.length === 0) return null;

  const byUser = new Map<string, ProjectMemberRole>();
  for (const link of links) {
    byUser.set(link.userId, link.role);
  }

  const rows = [...byUser.entries()].map(([memberId, role]) => ({
    project_id: projectId,
    user_id: memberId,
    role,
    created_by: userId,
  }));

  const { error } = await admin.from("project_members").insert(rows);
  return error?.message ?? null;
}

function mapMilestone(row: Record<string, unknown>): PortfolioMilestone {
  return {
    id: String(row.id ?? ""),
    projectId: String(row.project_id ?? ""),
    title: String(row.title ?? ""),
    description: row.description ? String(row.description) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    status: normalizeMilestoneStatus(row.status),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

const PROJECT_SELECT = `
  id,
  title,
  slug,
  description,
  status,
  kind,
  portfolio_status,
  progress,
  metadata,
  start_date,
  end_date,
  budget,
  budget_spent,
  published,
  published_site_url,
  pm_project_id,
  retainer_status,
  retainer_monthly_amount,
  retainer_currency,
  retainer_started_on,
  retainer_renews_on,
  created_at,
  updated_at,
  clients!client_id(id, name, company),
  project_partners(role, partners(id, name, kind)),
  project_members(role, user_id, user_profiles(id, full_name, avatar_url)),
  pm_projects!pm_project_id(id, name)
`;

// =============================================================================
// READS (any authenticated member)
// =============================================================================

export async function getPortfolioData(
  filters?: PortfolioFilters,
): Promise<PortfolioDashboardData> {
  const empty: PortfolioDashboardData = {
    projects: [],
    stats: summarizePortfolio([]),
    partners: [],
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const admin = getAdminClient() as Db;
    const role = await getWorkspaceRole(admin, user.id);

    const [projectsResult, partnersResult] = await Promise.all([
      admin
        .from("projects")
        .select(PROJECT_SELECT)
        .order("portfolio_status", { ascending: true })
        .order("title", { ascending: true }),
      admin.from("partners").select("id, name, kind, status").order("name", { ascending: true }),
    ]);

    if (projectsResult.error) {
      logger.error("portfolio.list.failed", { error: projectsResult.error.message });
      return empty;
    }

    const rows = (Array.isArray(projectsResult.data) ? projectsResult.data : []) as Record<
      string,
      unknown
    >[];
    const activeFilters = filters ?? {};
    const canSeeAmounts = canEditPortfolio(role);
    const projects = rows
      .map(mapPortfolioProject)
      .filter((project) => matchesPortfolioFilters(project, activeFilters))
      .map((project) =>
        canSeeAmounts ? project : redactPortfolioAmounts(project),
      );

    const partnerRows = (Array.isArray(partnersResult.data) ? partnersResult.data : []) as Record<
      string,
      unknown
    >[];
    const partners: PortfolioPartnerSummary[] = partnerRows.map((row) => ({
      id: String(row.id ?? ""),
      name: String(row.name ?? ""),
      kind: normalizePartnerKind(row.kind),
      status: row.status === "inactive" ? "inactive" : "active",
    }));

    return { projects, stats: summarizePortfolio(projects), partners };
  } catch (error) {
    logger.error("portfolio.list.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return empty;
  }
}

export async function getPortfolioProject(id: string): Promise<PortfolioProjectDetail | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !id) return null;

    const admin = getAdminClient() as Db;
    const role = await getWorkspaceRole(admin, user.id);

    const { data, error } = await admin
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const mapped = mapPortfolioProject(data as Record<string, unknown>);
    const summary: PortfolioProjectSummary = canEditPortfolio(role)
      ? mapped
      : redactPortfolioAmounts(mapped);

    const noCounts = Promise.resolve({ count: 0, data: null, error: null });

    const [milestonesResult, openResult, completedResult] = await Promise.all([
      admin
        .from("milestones")
        .select("id, project_id, title, description, due_date, status, created_at, updated_at")
        .eq("project_id", id)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      summary.taskListId
        ? admin
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("pm_project_id", summary.taskListId)
            .neq("status", "approved")
        : noCounts,
      summary.taskListId
        ? admin
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("pm_project_id", summary.taskListId)
            .eq("status", "approved")
        : noCounts,
    ]);

    const milestoneRows = (
      Array.isArray(milestonesResult.data) ? milestonesResult.data : []
    ) as Record<string, unknown>[];

    return {
      ...summary,
      milestones: milestoneRows.map(mapMilestone),
      taskCounts: {
        open: Number(openResult.count ?? 0),
        completed: Number(completedResult.count ?? 0),
      },
    };
  } catch (error) {
    logger.error("portfolio.detail.error", {
      projectId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// =============================================================================
// PROJECTS (founder writes)
// =============================================================================

export async function createPortfolioProject(
  input: CreatePortfolioProjectInput,
): Promise<PortfolioActionResult> {
  const parsed = projectFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project" };
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;

    const partnerIds = (data.partners ?? []).map((link) => link.partnerId);
    const memberIds = (data.members ?? []).map((link) => link.userId);

    const [unknownPartners, unknownMembers] = await Promise.all([
      missingIds(admin, "partners", partnerIds),
      missingIds(admin, "user_profiles", memberIds),
    ]);
    if (unknownPartners.length > 0) {
      return { error: `Unknown partner: ${unknownPartners.join(", ")}` };
    }
    if (unknownMembers.length > 0) {
      return { error: `Unknown member: ${unknownMembers.join(", ")}` };
    }

    if (data.clientId) {
      const { data: client } = await admin
        .from("clients")
        .select("id")
        .eq("id", data.clientId)
        .maybeSingle();
      if (!client) return { error: "Client not found" };
    }
    if (data.taskListId) {
      const { data: taskList } = await admin
        .from("pm_projects")
        .select("id")
        .eq("id", data.taskListId)
        .maybeSingle();
      if (!taskList) return { error: "Task list not found" };
    }

    const slug = await uniqueSlug(admin, slugify(data.slug || data.title), null);

    const metadata: Record<string, unknown> = {};
    if (data.category) metadata.category = data.category;

    const payload: Record<string, unknown> = {
      user_id: user.id,
      title: data.title,
      slug,
      kind: data.kind,
      portfolio_status: data.portfolioStatus,
      status: publicStatusFor(data.portfolioStatus),
      description: data.description || null,
      client_id: data.clientId ?? null,
      metadata: metadata as Json,
      progress: data.progress ?? null,
      retainer_status: data.retainerStatus ?? "none",
      retainer_monthly_amount: data.retainerMonthlyAmount ?? null,
      retainer_currency: data.retainerCurrency?.toUpperCase() || "PHP",
      retainer_started_on: data.retainerStartedOn ?? null,
      retainer_renews_on: data.retainerRenewsOn ?? null,
      start_date: data.startDate ?? null,
      end_date: data.endDate ?? null,
      budget: data.budget ?? null,
      published_site_url: data.publishedSiteUrl || null,
      pm_project_id: data.taskListId ?? null,
      published: false,
    };

    const { data: created, error } = await admin
      .from("projects")
      .insert(payload)
      .select("id")
      .single();
    if (error || !created) {
      logger.error("portfolio.project.create_failed", { error: error?.message });
      return { error: error?.message ?? "Failed to create project" };
    }

    const projectId = String(created.id);

    if (data.partners !== undefined) {
      const junctionError = await replaceProjectPartners(admin, projectId, data.partners, user.id);
      if (junctionError) {
        await admin.from("projects").delete().eq("id", projectId);
        return { error: junctionError };
      }
    }

    if (data.members !== undefined) {
      const junctionError = await replaceProjectMembers(admin, projectId, data.members, user.id);
      if (junctionError) {
        await admin.from("projects").delete().eq("id", projectId);
        return { error: junctionError };
      }
    }

    logAudit({
      action: "CREATE",
      resource: "projects",
      resourceId: projectId,
      details: {
        title: data.title,
        kind: data.kind,
        portfolioStatus: data.portfolioStatus,
        slug,
      },
    });
    logger.info("portfolio.project.created", {
      projectId,
      userId: user.id,
      kind: data.kind,
      portfolioStatus: data.portfolioStatus,
    });

    revalidatePath("/portfolio");
    return { success: true, id: projectId };
  } catch (error) {
    logger.error("portfolio.project.create_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: error instanceof Error ? error.message : "Failed to create project" };
  }
}

export async function updatePortfolioProject(
  id: string,
  input: UpdatePortfolioProjectInput,
): Promise<PortfolioActionResult> {
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project" };
  }
  const data = parsed.data;
  if (!id) return { error: "Project id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;

    const { data: existingRow } = await admin
      .from("projects")
      .select("id, title, slug, metadata")
      .eq("id", id)
      .maybeSingle();
    if (!existingRow) return { error: "Project not found" };
    const existing = existingRow as Record<string, unknown>;

    if (data.clientId) {
      const { data: client } = await admin
        .from("clients")
        .select("id")
        .eq("id", data.clientId)
        .maybeSingle();
      if (!client) return { error: "Client not found" };
    }
    if (data.taskListId) {
      const { data: taskList } = await admin
        .from("pm_projects")
        .select("id")
        .eq("id", data.taskListId)
        .maybeSingle();
      if (!taskList) return { error: "Task list not found" };
    }

    if (data.partners !== undefined) {
      const unknown = await missingIds(
        admin,
        "partners",
        data.partners.map((link) => link.partnerId),
      );
      if (unknown.length > 0) return { error: `Unknown partner: ${unknown.join(", ")}` };
    }
    if (data.members !== undefined) {
      const unknown = await missingIds(
        admin,
        "user_profiles",
        data.members.map((link) => link.userId),
      );
      if (unknown.length > 0) return { error: `Unknown member: ${unknown.join(", ")}` };
    }

    const update: Record<string, unknown> = {};

    if (data.title !== undefined) update.title = data.title;
    if (data.kind !== undefined) update.kind = data.kind;
    if (data.portfolioStatus !== undefined) {
      update.portfolio_status = data.portfolioStatus;
      update.status = publicStatusFor(data.portfolioStatus);
    }
    if (data.description !== undefined) update.description = data.description || null;
    if (data.clientId !== undefined) update.client_id = data.clientId;
    if (data.progress !== undefined) update.progress = data.progress;
    if (data.startDate !== undefined) update.start_date = data.startDate;
    if (data.endDate !== undefined) update.end_date = data.endDate;
    if (data.budget !== undefined) update.budget = data.budget;
    if (data.retainerStatus !== undefined) update.retainer_status = data.retainerStatus;
    if (data.retainerMonthlyAmount !== undefined) {
      update.retainer_monthly_amount = data.retainerMonthlyAmount;
    }
    if (data.retainerCurrency !== undefined) {
      update.retainer_currency = data.retainerCurrency.toUpperCase();
    }
    if (data.retainerStartedOn !== undefined) {
      update.retainer_started_on = data.retainerStartedOn;
    }
    if (data.retainerRenewsOn !== undefined) {
      update.retainer_renews_on = data.retainerRenewsOn;
    }
    if (data.publishedSiteUrl !== undefined) {
      update.published_site_url = data.publishedSiteUrl || null;
    }
    if (data.taskListId !== undefined) update.pm_project_id = data.taskListId;

    if (data.slug !== undefined) {
      const requested = slugify(data.slug);
      const fallback =
        slugify(String(existing.title ?? "")) || slugify(String(existing.slug ?? ""));
      update.slug = await uniqueSlug(admin, requested || fallback, id);
    }

    if (data.category !== undefined) {
      const existingMetadata = (existing.metadata ?? {}) as Record<string, unknown>;
      const metadata = { ...existingMetadata };
      if (data.category) metadata.category = data.category;
      else delete metadata.category;
      update.metadata = metadata as Json;
    }

    if (
      Object.keys(update).length === 0 &&
      data.partners === undefined &&
      data.members === undefined
    ) {
      return { success: true };
    }

    if (Object.keys(update).length > 0) {
      const { data: updated, error } = await admin
        .from("projects")
        .update(update)
        .eq("id", id)
        .select("id");
      if (error) return { error: error.message };
      if (!updated || updated.length === 0) return { error: "Project not found" };
    }

    if (data.partners !== undefined) {
      const junctionError = await replaceProjectPartners(admin, id, data.partners, user.id);
      if (junctionError) return { error: junctionError };
    }
    if (data.members !== undefined) {
      const junctionError = await replaceProjectMembers(admin, id, data.members, user.id);
      if (junctionError) return { error: junctionError };
    }

    logAudit({
      action: "UPDATE",
      resource: "projects",
      resourceId: id,
      details: { fields: Object.keys(update) },
    });
    logger.info("portfolio.project.updated", {
      projectId: id,
      userId: user.id,
      fields: Object.keys(update),
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    logger.error("portfolio.project.update_error", {
      projectId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: error instanceof Error ? error.message : "Failed to update project" };
  }
}

export async function archivePortfolioProject(id: string): Promise<PortfolioActionResult> {
  if (!id) return { error: "Project id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;

    const { data: updated, error } = await admin
      .from("projects")
      .update({ portfolio_status: "archived", status: "archived" })
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "Project not found" };

    logAudit({
      action: "ARCHIVE",
      resource: "projects",
      resourceId: id,
      details: { portfolioStatus: "archived" },
    });
    logger.info("portfolio.project.archived", { projectId: id, userId: user.id });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to archive project",
    };
  }
}

/** Founder or an assigned member may move the progress bar. */
export async function updatePortfolioProgress(
  id: string,
  progress: number,
): Promise<PortfolioActionResult> {
  const parsed = progressSchema.safeParse(progress);
  if (!parsed.success) return { error: "Progress must be an integer from 0 to 100" };
  if (!id) return { error: "Project id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const admin = getAdminClient() as Db;

    const role = await getWorkspaceRole(supabase, user.id);
    const assigned = await isProjectMember(admin, id, user.id);
    if (!canUpdateProjectProgress(role, assigned)) {
      return { error: "Only founders or members assigned to this project can update progress" };
    }

    const { data: updated, error } = await admin
      .from("projects")
      .update({ progress: parsed.data })
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "Project not found" };

    logAudit({
      action: "UPDATE",
      resource: "projects",
      resourceId: id,
      details: { progress: parsed.data },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update progress",
    };
  }
}

// =============================================================================
// PARTNERS (founder writes)
// =============================================================================

export async function createPartner(input: CreatePartnerInput): Promise<PortfolioActionResult> {
  const parsed = createPartnerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid partner" };
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;
    const { data: created, error } = await admin
      .from("partners")
      .insert({
        name: data.name,
        kind: data.kind,
        contact_name: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        notes: data.notes || null,
        status: data.status,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !created) return { error: error?.message ?? "Failed to create partner" };

    const partnerId = String(created.id);
    logAudit({
      action: "CREATE",
      resource: "partners",
      resourceId: partnerId,
      details: { name: data.name, kind: data.kind },
    });
    logger.info("portfolio.partner.created", { partnerId, userId: user.id });

    revalidatePath("/portfolio");
    return { success: true, id: partnerId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create partner" };
  }
}

export async function updatePartner(
  id: string,
  input: UpdatePartnerInput,
): Promise<PortfolioActionResult> {
  const parsed = updatePartnerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid partner" };
  }
  if (!id) return { error: "Partner id is required" };
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.kind !== undefined) update.kind = data.kind;
    if (data.contactName !== undefined) update.contact_name = data.contactName || null;
    if (data.email !== undefined) update.email = data.email || null;
    if (data.phone !== undefined) update.phone = data.phone || null;
    if (data.website !== undefined) update.website = data.website || null;
    if (data.notes !== undefined) update.notes = data.notes || null;
    if (data.status !== undefined) update.status = data.status;

    if (Object.keys(update).length === 0) return { success: true };

    const admin = getAdminClient() as Db;
    const { data: updated, error } = await admin
      .from("partners")
      .update(update)
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "Partner not found" };

    logAudit({
      action: "UPDATE",
      resource: "partners",
      resourceId: id,
      details: { fields: Object.keys(update) },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update partner" };
  }
}

export async function deletePartner(id: string): Promise<PortfolioActionResult> {
  if (!id) return { error: "Partner id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;
    const { data: partner } = await admin
      .from("partners")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

    const { data: deleted, error } = await admin
      .from("partners")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "Partner not found" };

    logAudit({
      action: "DELETE",
      resource: "partners",
      resourceId: id,
      details: { name: partner?.name ?? null },
    });
    logger.info("portfolio.partner.deleted", { partnerId: id, userId: user.id });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete partner" };
  }
}

export async function addProjectPartner(
  projectId: string,
  partnerId: string,
  role?: string,
): Promise<PortfolioActionResult> {
  if (!projectId || !partnerId) return { error: "Project and partner are required" };
  const trimmedRole = role?.trim() || null;
  if (trimmedRole && trimmedRole.length > 120) {
    return { error: "Partner role must be 120 characters or fewer" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;
    const unknown = await missingIds(admin, "partners", [partnerId]);
    if (unknown.length > 0) return { error: "Partner not found" };

    const { error } = await admin.from("project_partners").upsert(
      {
        project_id: projectId,
        partner_id: partnerId,
        role: trimmedRole,
        created_by: user.id,
      },
      { onConflict: "project_id,partner_id" },
    );
    if (error) return { error: error.message };

    logAudit({
      action: "CREATE",
      resource: "project_partners",
      resourceId: `${projectId}:${partnerId}`,
      details: { projectId, partnerId, role: trimmedRole },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to link partner" };
  }
}

export async function removeProjectPartner(
  projectId: string,
  partnerId: string,
): Promise<PortfolioActionResult> {
  if (!projectId || !partnerId) return { error: "Project and partner are required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;
    const { data: deleted, error } = await admin
      .from("project_partners")
      .delete()
      .eq("project_id", projectId)
      .eq("partner_id", partnerId)
      .select("partner_id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "Partner is not linked to this project" };

    logAudit({
      action: "DELETE",
      resource: "project_partners",
      resourceId: `${projectId}:${partnerId}`,
      details: { projectId, partnerId },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to unlink partner" };
  }
}

// =============================================================================
// MEMBERS (founder writes; assignment notifies the member best-effort)
// =============================================================================

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectMemberRole = "contributor",
): Promise<PortfolioActionResult> {
  if (!projectId || !userId) return { error: "Project and member are required" };

  const parsedRole = memberRoleSchema.safeParse(role);
  if (!parsedRole.success) return { error: "Invalid project role" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;
    const [unknownMember, { data: project }] = await Promise.all([
      missingIds(admin, "user_profiles", [userId]),
      admin.from("projects").select("id, title").eq("id", projectId).maybeSingle(),
    ]);
    if (unknownMember.length > 0) return { error: "Member not found" };
    if (!project) return { error: "Project not found" };

    const { error } = await admin.from("project_members").upsert(
      {
        project_id: projectId,
        user_id: userId,
        role: parsedRole.data,
        created_by: user.id,
      },
      { onConflict: "project_id,user_id" },
    );
    if (error) return { error: error.message };

    logAudit({
      action: "CREATE",
      resource: "project_members",
      resourceId: `${projectId}:${userId}`,
      details: { projectId, userId, role: parsedRole.data },
    });
    logger.info("portfolio.member.added", {
      projectId,
      memberId: userId,
      role: parsedRole.data,
      userId: user.id,
    });

    try {
      await notifyUsers(getAdminClient(), [userId], {
        title: "Added to a project",
        message: String(project.title ?? "A portfolio project"),
        type: "assignment",
        relatedId: projectId,
        actionUrl: `/portfolio/${projectId}`,
        actorId: user.id,
        entityType: "project",
        entityId: projectId,
      });
    } catch (error) {
      logger.warn("portfolio.member.notify_failed", {
        projectId,
        memberId: userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to add member" };
  }
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<PortfolioActionResult> {
  if (!projectId || !userId) return { error: "Project and member are required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const denied = await requireFounder(supabase, user.id);
    if (denied) return denied;

    const admin = getAdminClient() as Db;
    const { data: deleted, error } = await admin
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .select("user_id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0)
      return { error: "Member is not assigned to this project" };

    logAudit({
      action: "DELETE",
      resource: "project_members",
      resourceId: `${projectId}:${userId}`,
      details: { projectId, userId },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to remove member" };
  }
}

// =============================================================================
// MILESTONES (founder or assigned member)
// =============================================================================

export async function createProjectMilestone(
  projectId: string,
  input: CreateMilestoneInput,
): Promise<PortfolioActionResult> {
  const parsed = milestoneInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid milestone" };
  }
  if (!projectId) return { error: "Project id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const admin = getAdminClient() as Db;
    const { data: project } = await admin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) return { error: "Project not found" };

    const denied = await requireProjectEditor(supabase, admin, projectId, user.id);
    if (denied) return denied;

    const data = parsed.data;
    const { data: created, error } = await admin
      .from("milestones")
      .insert({
        project_id: projectId,
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate,
        status: "pending",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !created) return { error: error?.message ?? "Failed to create milestone" };

    logAudit({
      action: "CREATE",
      resource: "milestones",
      resourceId: String(created.id),
      details: { projectId, title: data.title, dueDate: data.dueDate },
    });

    revalidatePath("/portfolio");
    return { success: true, id: String(created.id) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create milestone" };
  }
}

export async function setProjectMilestoneStatus(
  id: string,
  status: MilestoneStatus,
): Promise<PortfolioActionResult> {
  const parsed = milestoneStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid milestone status" };
  if (!id) return { error: "Milestone id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const admin = getAdminClient() as Db;
    const { data: milestone } = await admin
      .from("milestones")
      .select("id, project_id, title")
      .eq("id", id)
      .maybeSingle();
    if (!milestone?.project_id) return { error: "Milestone not found" };

    const projectId = String(milestone.project_id);
    const denied = await requireProjectEditor(supabase, admin, projectId, user.id);
    if (denied) return denied;

    const { data: updated, error } = await admin
      .from("milestones")
      .update({ status: parsed.data })
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "Milestone not found" };

    logAudit({
      action: "UPDATE",
      resource: "milestones",
      resourceId: id,
      details: { projectId, status: parsed.data },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update milestone" };
  }
}

export async function deleteProjectMilestone(id: string): Promise<PortfolioActionResult> {
  if (!id) return { error: "Milestone id is required" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const admin = getAdminClient() as Db;
    const { data: milestone } = await admin
      .from("milestones")
      .select("id, project_id, title")
      .eq("id", id)
      .maybeSingle();
    if (!milestone?.project_id) return { error: "Milestone not found" };

    const projectId = String(milestone.project_id);
    const denied = await requireProjectEditor(supabase, admin, projectId, user.id);
    if (denied) return denied;

    const { data: deleted, error } = await admin
      .from("milestones")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "Milestone not found" };

    logAudit({
      action: "DELETE",
      resource: "milestones",
      resourceId: id,
      details: { projectId, title: milestone.title ?? null },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete milestone" };
  }
}
