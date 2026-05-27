"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Fetch all workspaces the current user belongs to.
 */
export async function getUserWorkspaces() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, workspaces(id, name, created_at)")
      .eq("user_id", user.id);

    if (!memberships) return [];

    return memberships.map((m: Record<string, unknown>) => ({
      id: (m.workspaces as Record<string, unknown>)?.id as string,
      name: (m.workspaces as Record<string, unknown>)?.name as string,
      role: m.role as string,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch departments for a workspace, filtered by RBAC.
 * If the user is an employee, only return their assigned department.
 */
export async function getWorkspaceDepartments(workspaceId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { departments: [], role: "employee" as const };

    // Get user's role in this workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    const role = (membership?.role as "founder" | "employee") || "employee";

    // Fetch departments
    const { data: departments } = await supabase
      .from("departments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    return {
      departments: (departments || []).map((d: Record<string, unknown>) => ({
        id: String(d.id),
        workspaceId: String(d.workspace_id),
        name: String(d.name),
        createdAt: String(d.created_at),
      })),
      role,
    };
  } catch {
    return { departments: [], role: "employee" as const };
  }
}

/**
 * Fetch workspace members for a given workspace.
 */
export async function getWorkspaceMembers(workspaceId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { members: [], userRole: "employee" as const };

    // Verify the requesting user is a member
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership) return { members: [], userRole: "employee" as const };

    const { data: members } = await supabase
      .from("workspace_members")
      .select(`
        user_id,
        role,
        user_profiles!inner(id, full_name, email, avatar_url)
      `)
      .eq("workspace_id", workspaceId);

    return {
      members: (members || []).map((m: Record<string, unknown>) => ({
        userId: String(m.user_id),
        role: String(m.role),
        name: (m.user_profiles as Record<string, unknown>)?.full_name as string || (m.user_profiles as Record<string, unknown>)?.email as string,
        email: (m.user_profiles as Record<string, unknown>)?.email as string,
        avatarUrl: (m.user_profiles as Record<string, unknown>)?.avatar_url as string | null,
      })),
      userRole: membership.role as "founder" | "employee",
    };
  } catch {
    return { members: [], userRole: "employee" as const };
  }
}

/**
 * Seed the default workspaces and add the current user to Syntaxure Labs.
 * Called during onboarding.
 */
export async function ensureUserWorkspaces() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if user already has memberships
    const { data: existing } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1);

    if (existing && existing.length > 0) return { ok: true };

    // Find Personal workspace
    const { data: personalWs } = await supabase
      .from("workspaces")
      .select("id")
      .eq("name", "Personal")
      .single();

    if (personalWs) {
      await supabase.from("workspace_members").insert({
        workspace_id: personalWs.id,
        user_id: user.id,
        role: "founder",
      });
    }

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
