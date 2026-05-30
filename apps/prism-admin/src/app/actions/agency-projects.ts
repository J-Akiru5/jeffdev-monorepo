"use server";

/**
 * Agency Projects & Milestones Server Actions
 * -------------------------------------------
 * CRUD for projects and milestones in the agency section.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { MilestoneRow } from "@/lib/database.types";

// ─── Validation Schemas ──────────────────────────────────────────────────────

const projectSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  title: z.string().min(1).max(100),
  userId: z.string().uuid("Please select a valid client"),
  client: z.string().min(1).max(100),
  clientEmail: z.string().email("Please enter a valid client email").optional().or(z.literal("")),
  category: z.string().min(1).max(50),
  tagline: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  challenge: z.string().optional().default(""),
  solution: z.string().optional().default(""),
  results: z.array(z.object({ metric: z.string(), value: z.string() })).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  testimonial: z.object({ quote: z.string(), author: z.string(), role: z.string() }).nullable().optional(),
  image: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  status: z.enum(["pending", "active", "paused", "completed"]).default("active"),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  budget: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  assignedPartner: z.string().optional(),
  assignedEmployees: z.array(z.string()).optional().default([]),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getProjectId(slug: string): Promise<string | null> {
  const supabase = getAdminClient();
  const { data } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
  return data?.id || null;
}

// ─── Projects CRUD ────────────────────────────────────────────────────────────

export async function createAgencyProject(data: ProjectFormData): Promise<ActionResult> {
  try {
    const validated = projectSchema.parse(data);
    const supabase = getAdminClient();

    const { data: existing } = await supabase.from("projects").select("id").eq("slug", validated.slug).maybeSingle();
    if (existing) return { success: false, error: "A project with this slug already exists" };

    const { error } = await supabase.from("projects").insert({
      user_id: validated.userId,
      slug: validated.slug,
      title: validated.title,
      description: validated.description,
      status: validated.status,
      budget: validated.budget || null,
      start_date: validated.startDate || null,
      end_date: validated.deadline || null,
      client_name: validated.client,
      client_email: validated.clientEmail || null,
      published: validated.published,
      metadata: {
        category: validated.category,
        tagline: validated.tagline,
        challenge: validated.challenge,
        solution: validated.solution,
        results: validated.results,
        technologies: validated.technologies,
        testimonial: validated.testimonial,
        image: validated.image,
        featured: validated.featured,
        order: validated.order,
        progress: validated.progress,
        assignedPartner: validated.assignedPartner || null,
        assignedEmployees: validated.assignedEmployees || [],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    await logAuditEvent({ action: "CREATE", resource: "projects", resourceId: validated.slug, details: { title: validated.title } });
    revalidatePath("/admin/agency/projects");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0]!.message };
    console.error("[CREATE AGENCY PROJECT ERROR]", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateAgencyProject(slug: string, data: ProjectFormData): Promise<ActionResult> {
  try {
    const validated = projectSchema.parse(data);
    const supabase = getAdminClient();

    const { data: existing } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
    if (!existing) return { success: false, error: "Project not found" };

    if (slug !== validated.slug) {
      const { data: newSlugExists } = await supabase.from("projects").select("id").eq("slug", validated.slug).maybeSingle();
      if (newSlugExists) return { success: false, error: "A project with the new slug already exists" };
    }

    const { error: updateError } = await supabase.from("projects").update({
      user_id: validated.userId,
      slug: validated.slug,
      title: validated.title,
      description: validated.description,
      status: validated.status,
      start_date: validated.startDate || null,
      end_date: validated.deadline || null,
      budget: validated.budget !== undefined ? validated.budget.toString() : null,
      budget_spent: validated.paidAmount !== undefined ? validated.paidAmount.toString() : "0",
      client_name: validated.client,
      client_email: validated.clientEmail || null,
      published: validated.published,
      metadata: {
        category: validated.category,
        tagline: validated.tagline,
        challenge: validated.challenge,
        solution: validated.solution,
        results: validated.results,
        technologies: validated.technologies,
        testimonial: validated.testimonial,
        image: validated.image,
        featured: validated.featured,
        order: validated.order,
        progress: validated.progress,
        assignedPartner: validated.assignedPartner || null,
        assignedEmployees: validated.assignedEmployees || [],
      },
      updated_at: new Date().toISOString(),
    }).eq("slug", slug);

    if (updateError) throw updateError;

    await logAuditEvent({ action: "UPDATE", resource: "projects", resourceId: validated.slug, details: { title: validated.title, oldSlug: slug !== validated.slug ? slug : undefined } });
    revalidatePath("/admin/agency/projects");
    revalidatePath(`/admin/agency/projects/${slug}`);
    if (slug !== validated.slug) revalidatePath(`/admin/agency/projects/${validated.slug}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0]!.message };
    console.error("[UPDATE AGENCY PROJECT ERROR]", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteAgencyProject(slug: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: existing } = await supabase.from("projects").select("title").eq("slug", slug).maybeSingle();
    if (!existing) return { success: false, error: "Project not found" };

    const { error: deleteError } = await supabase.from("projects").delete().eq("slug", slug);
    if (deleteError) throw deleteError;

    await logAuditEvent({ action: "DELETE", resource: "projects", resourceId: slug, details: { title: existing.title } });
    revalidatePath("/admin/agency/projects");

    return { success: true };
  } catch (error) {
    console.error("[DELETE AGENCY PROJECT ERROR]", error);
    return { success: false, error: "Failed to delete project" };
  }
}

// ─── Project Status & Progress ────────────────────────────────────────────────

export async function updateAgencyProjectStatus(slug: string, status: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: project } = await supabase.from("projects").select("id, metadata").eq("slug", slug).maybeSingle();
    if (!project) return { success: false, error: "Project not found" };

    const metadata = (project.metadata || {}) as Record<string, unknown>;
    const oldStatus = metadata.status as string | undefined;
    metadata.status = status;

    const { error } = await supabase.from("projects").update({ status, metadata, updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) throw error;

    await logAuditEvent({ action: "STATUS_CHANGE", resource: "projects", resourceId: slug, details: { oldStatus, newStatus: status } });
    revalidatePath("/admin/agency/projects");
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE PROJECT STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function updateAgencyProjectProgress(slug: string, progress: number): Promise<ActionResult> {
  try {
    const validProgress = Math.max(0, Math.min(100, progress));
    const supabase = getAdminClient();
    const { data: project } = await supabase.from("projects").select("id, metadata").eq("slug", slug).maybeSingle();
    if (!project) return { success: false, error: "Project not found" };

    const metadata = (project.metadata || {}) as Record<string, unknown>;
    metadata.progress = validProgress;

    const { error } = await supabase.from("projects").update({ metadata, updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "projects", resourceId: slug, details: { field: "progress", value: validProgress } });
    revalidatePath("/admin/agency/projects");
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE PROJECT PROGRESS ERROR]", error);
    return { success: false, error: "Failed to update progress" };
  }
}

export async function updateAgencyProjectDetails(slug: string, data: { status?: string; progress?: number; deadline?: string; startDate?: string; budget?: number; paidAmount?: number; assignedPartner?: string; assignedEmployees?: string[] }): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: project } = await supabase.from("projects").select("id, metadata").eq("slug", slug).maybeSingle();
    if (!project) return { success: false, error: "Project not found" };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status) updates.status = data.status;
    if (data.deadline) updates.end_date = data.deadline;
    if (data.startDate) updates.start_date = data.startDate;
    if (data.budget !== undefined) updates.budget = data.budget.toString();

    const metadata = (project.metadata || {}) as Record<string, unknown>;
    if (data.progress !== undefined) metadata.progress = data.progress;
    if (data.paidAmount !== undefined) metadata.paid_amount = data.paidAmount;
    if (data.assignedPartner) metadata.assigned_partner = data.assignedPartner;
    if (data.assignedEmployees) metadata.assigned_employees = data.assignedEmployees;
    updates.metadata = metadata;

    const { error } = await supabase.from("projects").update(updates).eq("slug", slug);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "projects", resourceId: slug, details: data });
    revalidatePath("/admin/agency/projects");
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE PROJECT DETAILS ERROR]", error);
    return { success: false, error: "Failed to update project" };
  }
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function addAgencyMilestone(slug: string, milestone: { title: string; description?: string; due_date: string; status?: string; deliverables?: string[] }): Promise<ActionResult & { milestone?: unknown }> {
  try {
    const supabase = getAdminClient();
    const projectId = await getProjectId(slug);
    if (!projectId) return { success: false, error: "Project not found" };

    const { data: newMilestone, error } = await supabase.from("milestones").insert({
      project_id: projectId,
      title: milestone.title,
      description: milestone.description || null,
      due_date: milestone.due_date,
      status: (milestone.status || "pending") as MilestoneRow["status"],
      deliverables: milestone.deliverables || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select("*").single();

    if (error) throw error;

    await logAuditEvent({ action: "CREATE", resource: "projects", resourceId: slug, details: { milestone: newMilestone.title } });
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true, milestone: newMilestone };
  } catch (error) {
    console.error("[ADD MILESTONE ERROR]", error);
    return { success: false, error: "Failed to add milestone" };
  }
}

export async function updateAgencyMilestoneStatus(slug: string, milestoneId: string, status: string): Promise<ActionResult & { progress?: number }> {
  try {
    const supabase = getAdminClient();
    const projectId = await getProjectId(slug);
    if (!projectId) return { success: false, error: "Project not found" };

    const { error } = await supabase.from("milestones").update({ status: status as MilestoneRow["status"], updated_at: new Date().toISOString() }).eq("id", milestoneId).eq("project_id", projectId);
    if (error) throw error;

    const { data: milestones } = await supabase.from("milestones").select("status").eq("project_id", projectId);
    const total = milestones?.length || 0;
    const completed = milestones?.filter((m) => m.status === "completed").length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const { data: project } = await supabase.from("projects").select("metadata").eq("slug", slug).maybeSingle();
    const metadata = (project?.metadata || {}) as Record<string, unknown>;
    metadata.progress = progress;
    await supabase.from("projects").update({ metadata, updated_at: new Date().toISOString() }).eq("slug", slug);

    await logAuditEvent({ action: "STATUS_CHANGE", resource: "projects", resourceId: slug, details: { milestoneId, status } });
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true, progress };
  } catch (error) {
    console.error("[UPDATE MILESTONE STATUS ERROR]", error);
    return { success: false, error: "Failed to update milestone" };
  }
}

export async function deleteAgencyMilestone(slug: string, milestoneId: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const projectId = await getProjectId(slug);
    if (!projectId) return { success: false, error: "Project not found" };

    const { error } = await supabase.from("milestones").delete().eq("id", milestoneId).eq("project_id", projectId);
    if (error) throw error;

    await logAuditEvent({ action: "DELETE", resource: "projects", resourceId: slug, details: { milestoneId } });
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[DELETE MILESTONE ERROR]", error);
    return { success: false, error: "Failed to delete milestone" };
  }
}

export async function toggleAgencyProjectPublish(slug: string, published: boolean): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: project } = await supabase.from("projects").select("id, metadata").eq("slug", slug).maybeSingle();
    if (!project) return { success: false, error: "Project not found" };

    const metadata = (project.metadata || {}) as Record<string, unknown>;
    metadata.published = published;

    const { error } = await supabase.from("projects").update({ published, metadata, updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "projects", resourceId: slug, details: { published } });
    revalidatePath("/admin/agency/projects");
    revalidatePath(`/admin/agency/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[TOGGLE PROJECT PUBLISH ERROR]", error);
    return { success: false, error: "Failed to toggle published state" };
  }
}

