"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update a workspace member's role.
 * Only founders can change roles.
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: "founder" | "employee"
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

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
 * Only founders can assign departments.
 */
export async function assignMemberDepartment(
  workspaceId: string,
  userId: string,
  departmentId: string | null
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

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
 * Only founders can remove members. Cannot remove yourself.
 */
export async function removeMember(
  workspaceId: string,
  userId: string
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    if (user.id === userId) {
      return { error: "Cannot remove yourself" };
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

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to remove member" };
  }
}
