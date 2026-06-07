"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
      changes: event.details || null,
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit is non-critical; never throw
  }
}

/**
 * Create a new project/list.
 */
export async function createProject(data: {
  name: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: data.name,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/tasks");
    return { project };
  } catch {
    return { error: "Failed to create list" };
  }
}

/**
 * Update a project/list.
 */
export async function updateProject(
  projectId: string,
  data: { name?: string }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("projects")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/tasks");
    return { success: true };
  } catch {
    return { error: "Failed to update list" };
  }
}

/**
 * Delete a project/list.
 */
export async function deleteProject(projectId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    // Fire audit asynchronously (never blocks the response)
    logAudit({
      action: "DELETE",
      resource: "projects",
      resourceId: projectId,
      details: { deletedBy: user.id },
    });

    revalidatePath("/tasks");
    return { success: true };
  } catch {
    return { error: "Failed to delete list" };
  }
}

/**
 * Fetch all projects/lists for the current user.
 */
export async function getProjects() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    return (projects || []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      name: String(p.name),
      createdAt: String(p.created_at),
      updatedAt: String(p.updated_at),
    }));
  } catch {
    return [];
  }
}
