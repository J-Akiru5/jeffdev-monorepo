"use server";

/**
 * Project Management Server Actions
 * -----------------------------------
 * CRUD for projects, milestones, and status updates.
 * Uses Supabase `projects` table + `milestones` table (previously embedded in Firestore).
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// Validation schemas
const projectUpdateSchema = z.object({
  status: z.enum(["pending", "active", "paused", "completed"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  deadline: z.string().optional(),
  startDate: z.string().optional(),
  budget: z.number().optional(),
  paidAmount: z.number().optional(),
  assignedPartner: z.string().optional(),
  assignedEmployees: z.array(z.string()).optional(),
});

const milestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().min(1),
  status: z
    .enum(["pending", "in_progress", "completed", "blocked"])
    .default("pending"),
  deliverables: z.array(z.string()).optional(),
});

/**
 * Get project by slug and return its ID
 */
async function getProjectId(slug: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getAdminClient() as any;
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id || null;
}

/**
 * Update project status
 */
export async function updateProjectStatus(slug: string, status: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: project } = await supabase
      .from("projects")
      .select("id, metadata")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const oldStatus =
      project.metadata &&
      typeof project.metadata === "object" &&
      "status" in (project.metadata as Record<string, unknown>)
        ? ((project.metadata as Record<string, unknown>).status as string)
        : undefined;

    const metadata = (project.metadata || {}) as Record<string, unknown>;
    metadata.status = status;

    const { error } = await supabase
      .from("projects")
      .update({
        status: status as "active" | "paused" | "completed" | "archived",
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (error) throw error;

    await logAuditEvent({
      action: "STATUS_CHANGE",
      resource: "projects",
      resourceId: slug,
      details: { oldStatus, newStatus: status },
    });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE PROJECT STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Update project progress (0-100)
 */
export async function updateProjectProgress(slug: string, progress: number) {
  try {
    const validProgress = Math.max(0, Math.min(100, progress));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: project } = await supabase
      .from("projects")
      .select("id, metadata")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const metadata = (project.metadata || {}) as Record<string, unknown>;
    metadata.progress = validProgress;

    const { error } = await supabase
      .from("projects")
      .update({
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "projects",
      resourceId: slug,
      details: { field: "progress", value: validProgress },
    });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE PROJECT PROGRESS ERROR]", error);
    return { success: false, error: "Failed to update progress" };
  }
}

/**
 * Update project details (deadline, budget, assignments)
 */
export async function updateProjectDetails(
  slug: string,
  data: z.infer<typeof projectUpdateSchema>,
) {
  try {
    const validated = projectUpdateSchema.parse(data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: project } = await supabase
      .from("projects")
      .select("id, metadata")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Build column updates
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.status) {
      updates.status = validated.status as
        | "active"
        | "paused"
        | "completed"
        | "archived";
    }
    if (validated.deadline) {
      updates.end_date = validated.deadline;
    }
    if (validated.startDate) {
      updates.start_date = validated.startDate;
    }
    if (validated.budget !== undefined) {
      updates.budget = validated.budget.toString();
    }

    // Store extra fields in metadata
    const metadata = (project.metadata || {}) as Record<string, unknown>;
    if (validated.progress !== undefined)
      metadata.progress = validated.progress;
    if (validated.paidAmount !== undefined)
      metadata.paid_amount = validated.paidAmount;
    if (validated.assignedPartner)
      metadata.assigned_partner = validated.assignedPartner;
    if (validated.assignedEmployees)
      metadata.assigned_employees = validated.assignedEmployees;

    updates.metadata = metadata;

    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("slug", slug);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "projects",
      resourceId: slug,
      details: validated,
    });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE PROJECT DETAILS ERROR]", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]!.message };
    }
    return { success: false, error: "Failed to update project" };
  }
}

/**
 * Add milestone to project (now using separate milestones table)
 */
export async function addMilestone(
  slug: string,
  milestone: Omit<z.infer<typeof milestoneSchema>, "id">,
) {
  try {
    const validated = milestoneSchema.parse(milestone);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const projectId = await getProjectId(slug);
    if (!projectId) {
      return { success: false, error: "Project not found" };
    }

    const { data: newMilestone, error } = await supabase
      .from("milestones")
      .insert({
        project_id: projectId,
        title: validated.title,
        description: validated.description || null,
        due_date: validated.due_date,
        status: validated.status || "pending",
        deliverables: validated.deliverables || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "projects",
      resourceId: slug,
      details: { milestone: newMilestone.title },
    });

    revalidatePath(`/admin/projects/${slug}`);

    return { success: true, milestone: newMilestone };
  } catch (error) {
    console.error("[ADD MILESTONE ERROR]", error);
    return { success: false, error: "Failed to add milestone" };
  }
}

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  slug: string,
  milestoneId: string,
  status: string,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const projectId = await getProjectId(slug);
    if (!projectId) {
      return { success: false, error: "Project not found" };
    }

    const { error } = await supabase
      .from("milestones")
      .update({
        status: status as "pending" | "in_progress" | "completed" | "blocked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestoneId)
      .eq("project_id", projectId);

    if (error) throw error;

    // Calculate progress based on completed milestones
    const { data: milestones } = await supabase
      .from("milestones")
      .select("status")
      .eq("project_id", projectId);

    const total = milestones?.length || 0;
    const completed =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      milestones?.filter((m: any) => m.status === "completed").length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update project progress in metadata
    const { data: project } = await supabase
      .from("projects")
      .select("metadata")
      .eq("slug", slug)
      .maybeSingle();

    const metadata = (project?.metadata || {}) as Record<string, unknown>;
    metadata.progress = progress;

    await supabase
      .from("projects")
      .update({
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    await logAuditEvent({
      action: "STATUS_CHANGE",
      resource: "projects",
      resourceId: slug,
      details: { milestoneId, status },
    });

    revalidatePath(`/admin/projects/${slug}`);

    return { success: true, progress };
  } catch (error) {
    console.error("[UPDATE MILESTONE STATUS ERROR]", error);
    return { success: false, error: "Failed to update milestone" };
  }
}

/**
 * Delete milestone
 */
export async function deleteMilestone(slug: string, milestoneId: string) {
  try {
    const supabase = getAdminClient();

    const projectId = await getProjectId(slug);
    if (!projectId) {
      return { success: false, error: "Project not found" };
    }

    const { error } = await supabase
      .from("milestones")
      .delete()
      .eq("id", milestoneId)
      .eq("project_id", projectId);

    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "projects",
      resourceId: slug,
      details: { milestoneId },
    });

    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("[DELETE MILESTONE ERROR]", error);
    return { success: false, error: "Failed to delete milestone" };
  }
}
