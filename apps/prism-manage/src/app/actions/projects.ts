"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database.types";
import { mapProject, getOrCreateDefaultProject } from "@/lib/pm-projects";
import type { Project } from "@/lib/schemas";

async function logAudit(event: {
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
 * Fetch the active lists (pm_projects) for a workspace.
 */
export async function getProjects(workspaceId: string): Promise<Project[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("pm_projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    return (data || []).map(mapProject);
  } catch {
    return [];
  }
}

/**
 * Create a list in a workspace. Any workspace member can create lists.
 */
export async function createProject(input: {
  workspaceId: string;
  name: string;
  color?: string;
}): Promise<{ success?: boolean; error?: string; project?: Project }> {
  const name = input.name.trim();
  if (!name || name.length > 100) {
    return { error: "List name must be 1-100 characters" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "You are not a member of this workspace" };

  const { count } = await supabase
    .from("pm_projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId);

  const { data, error } = await supabase
    .from("pm_projects")
    .insert({
      workspace_id: input.workspaceId,
      name,
      color: input.color || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      sort_order: count ?? 0,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) return { error: error?.message || "Failed to create list" };

  logAudit({
    action: "CREATE",
    resource: "pm_projects",
    resourceId: String(data.id),
    details: { name, workspaceId: input.workspaceId },
  });
  revalidatePath("/tasks");
  return { success: true, project: mapProject(data) };
}

/**
 * Update a list (rename / recolor / archive). Any workspace member can update.
 */
export async function updateProject(
  id: string,
  updates: { name?: string; color?: string; status?: "active" | "archived" },
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const update: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (!name || name.length > 100) {
      return { error: "List name must be 1-100 characters" };
    }
    update.name = name;
  }
  if (updates.color !== undefined) update.color = updates.color;
  if (updates.status !== undefined) update.status = updates.status;
  if (Object.keys(update).length === 0) return { success: true };

  const { data, error } = await supabase
    .from("pm_projects")
    .update(update as never)
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "List not found or you don't have permission" };
  }

  logAudit({ action: "UPDATE", resource: "pm_projects", resourceId: id, details: update });
  revalidatePath("/tasks");
  return { success: true };
}

/**
 * Delete a list. Founder-only (mirrors the RLS policy). Tasks in the list are
 * re-homed to the workspace's "General" list first, so no task silently
 * disappears from the UI.
 */
export async function deleteProject(id: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: project } = await supabase
    .from("pm_projects")
    .select("id, workspace_id, name")
    .eq("id", id)
    .maybeSingle();
  if (!project) return { error: "List not found or you don't have permission" };

  if (project.name === "General") {
    return { error: "The default General list can't be deleted — rename it instead." };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", project.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.role !== "founder") {
    return { error: "Only founders can delete lists" };
  }

  // Re-home tasks before deleting (FK is ON DELETE SET NULL, but silent
  // orphaning would hide tasks from the project-grouped UI).
  const fallback = await getOrCreateDefaultProject(
    supabase,
    String(project.workspace_id),
    user.id,
  );
  if (fallback && fallback.id !== id) {
    await supabase
      .from("tasks")
      .update({ pm_project_id: fallback.id })
      .eq("pm_project_id", id);
  }

  const { data: deleted, error } = await supabase
    .from("pm_projects")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!deleted || deleted.length === 0) {
    return { error: "List not found or you don't have permission" };
  }

  logAudit({
    action: "DELETE",
    resource: "pm_projects",
    resourceId: id,
    details: {
      name: project.name,
      workspaceId: project.workspace_id,
      tasksReassignedTo: fallback?.id ?? null,
    },
  });
  revalidatePath("/tasks");
  return { success: true };
}
