"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function logAudit(event: {
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  userId?: string;
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
      user_id: event.userId || user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit is non-critical; never throw
  }
}

/**
 * Update a workspace member's role.
 * Only founders in Workspace mode can change roles.
 *
 * @param mode - The current manage mode ("focus" | "workspace"). Must be "workspace" for founders to act.
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: "founder" | "employee",
  mode?: string,
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Mode check: member management requires Workspace mode
    if (mode && mode !== "workspace") {
      return { error: "Member management requires Workspace mode" };
    }

    // Verify the requester is a founder of this workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "founder") {
      return { error: "Only founders can change roles" };
    }

    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update role" };
  }
}

/**
 * Assign a department to a workspace member.
 * Only founders in Workspace mode can assign departments.
 *
 * @param mode - The current manage mode ("focus" | "workspace"). Must be "workspace" for founders to act.
 */
export async function assignMemberDepartment(
  workspaceId: string,
  userId: string,
  departmentId: string | null,
  mode?: string,
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Mode check: member management requires Workspace mode
    if (mode && mode !== "workspace") {
      return { error: "Member management requires Workspace mode" };
    }

    // Verify the requester is a founder
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "founder") {
      return { error: "Only founders can assign departments" };
    }

    const { error } = await supabase
      .from("workspace_members")
      .update({ department_id: departmentId })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to assign department" };
  }
}

/**
 * Remove a member from a workspace.
 * Only founders in Workspace mode can remove members. Cannot remove yourself.
 *
 * @param mode - The current manage mode ("focus" | "workspace"). Must be "workspace" for founders to act.
 */
export async function removeMember(
  workspaceId: string,
  userId: string,
  mode?: string,
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    if (user.id === userId) {
      return { error: "Cannot remove yourself" };
    }

    // Mode check: member management requires Workspace mode
    if (mode && mode !== "workspace") {
      return { error: "Member management requires Workspace mode" };
    }

    // Verify the requester is a founder
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "founder") {
      return { error: "Only founders can remove members" };
    }

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) return { error: error.message };

    // Fire audit asynchronously (never blocks the response)
    logAudit({
      action: "DELETE",
      resource: "workspace_members",
      resourceId: userId,
      details: { workspaceId, removedBy: user.id },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to remove member" };
  }
}
