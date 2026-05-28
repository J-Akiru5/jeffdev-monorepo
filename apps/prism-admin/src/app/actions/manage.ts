"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// Workspaces
// ──────────────────────────────────────────────

export async function getWorkspaces() {
  try {
    const admin = getAdminClient();
    const { data: workspaces } = await admin
      .from("workspaces")
      .select("*")
      .order("name", { ascending: true });

    if (!workspaces) return [];

    // Attach member counts
    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const { count } = await admin
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", ws.id);

        return {
          id: ws.id,
          name: ws.name,
          createdAt: ws.created_at,
          memberCount: count || 0,
        };
      }),
    );

    return enriched;
  } catch (error) {
    console.error("[manage] getWorkspaces error:", error);
    return [];
  }
}

export async function getWorkspaceDetail(workspaceId: string) {
  try {
    const admin = getAdminClient();

    const { data: workspace } = await admin
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (!workspace) return null;

    const { data: departments } = await admin
      .from("departments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    const { data: members } = await admin
      .from("workspace_members")
      .select(`
        user_id,
        role,
        department_id,
        user_profiles!inner(id, full_name, email, avatar_url)
      `)
      .eq("workspace_id", workspaceId);

    const { data: projects } = await admin
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.created_at,
      departments: (departments || []).map((d) => ({
        id: d.id,
        name: d.name,
      })),
      members: (members || []).map((m: Record<string, unknown>) => ({
        userId: String(m.user_id),
        role: String(m.role),
        departmentId: m.department_id ? String(m.department_id) : null,
        name:
          (m.user_profiles as Record<string, unknown>)?.full_name as string ||
          (m.user_profiles as Record<string, unknown>)?.email as string,
        email: (m.user_profiles as Record<string, unknown>)?.email as string,
        avatarUrl: (m.user_profiles as Record<string, unknown>)?.avatar_url as string | null,
      })),
      projects: (projects || []).map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        icon: p.icon,
        createdAt: p.created_at,
      })),
    };
  } catch (error) {
    console.error("[manage] getWorkspaceDetail error:", error);
    return null;
  }
}

// ──────────────────────────────────────────────
// Member Management (Admin bypasses RBAC)
// ──────────────────────────────────────────────

export async function adminUpdateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: "founder" | "employee",
) {
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .from("workspace_members")
      .update({ role: newRole })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/admin/workspaces");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function adminAssignDepartment(
  workspaceId: string,
  userId: string,
  departmentId: string | null,
) {
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .from("workspace_members")
      .update({ department_id: departmentId })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/admin/workspaces");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign department",
    };
  }
}

export async function adminRemoveMember(workspaceId: string, userId: string) {
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/admin/workspaces");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}

// ──────────────────────────────────────────────
// Projects (Cross-workspace)
// ──────────────────────────────────────────────

export async function getAllProjects() {
  try {
    const admin = getAdminClient();
    const { data: projects } = await admin
      .from("projects")
      .select("*, workspaces(name)")
      .order("created_at", { ascending: false });

    if (!projects) return [];

    const enriched = await Promise.all(
      projects.map(async (p) => {
        const { count } = await admin
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id);

        const { count: completedCount } = await admin
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id)
          .eq("status", "approved");

        return {
          id: p.id,
          name: p.name,
          color: p.color,
          workspaceName: (p.workspaces as Record<string, unknown>)?.name as string,
          workspaceId: p.workspace_id,
          taskCount: count || 0,
          completedCount: completedCount || 0,
          createdAt: p.created_at,
        };
      }),
    );

    return enriched;
  } catch (error) {
    console.error("[manage] getAllProjects error:", error);
    return [];
  }
}

export async function adminCreateProject(input: {
  name: string;
  workspaceId: string;
  color?: string;
}) {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("projects")
      .insert({
        name: input.name,
        workspace_id: input.workspaceId,
        color: input.color || "#6366f1",
        order: 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/projects");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

export async function adminUpdateProject(
  id: string,
  input: { name?: string; color?: string },
) {
  try {
    const admin = getAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.color !== undefined) updates.color = input.color;

    const { error } = await admin.from("projects").update(updates).eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/projects");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

export async function adminDeleteProject(id: string) {
  try {
    const admin = getAdminClient();
    await admin.from("tasks").delete().eq("project_id", id);
    const { error } = await admin.from("projects").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/projects");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete project",
    };
  }
}
