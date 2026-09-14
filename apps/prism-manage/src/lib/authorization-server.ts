/**
 * Supabase-backed authorization checks for Prism Manage server actions and
 * API routes. Resolves the current user's Syntaxure Labs workspace
 * membership and applies the pure rules from ./authorization.
 */

import type { WorkspaceAccess } from "@/lib/authorization";
import { isMarketingAuthorized } from "@/lib/authorization";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientLike = any;

/**
 * Resolve the current user's membership in the Syntaxure Labs workspace.
 * Returns null when the user has no membership there.
 */
export async function getSyntaxureWorkspaceAccess(
  supabase: SupabaseClientLike,
  userId: string,
): Promise<(WorkspaceAccess & { workspaceId: string }) | null> {
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select(
      "workspace_id, role, department_id, c_level_title, workspaces!inner(id, name)",
    )
    .eq("user_id", userId);

  if (!memberships) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const membership = memberships.find((m: any) => {
    const ws = m.workspaces;
    if (!ws) return false;
    return ws.name === "Syntaxure Labs" || ws.name === "Syntaxure Labs, Inc.";
  });

  if (!membership) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws = membership.workspaces as any;
  const departmentId = (membership as Record<string, unknown>).department_id as
    | string
    | null;

  let departmentName: string | null = null;
  if (departmentId) {
    const { data: department } = await supabase
      .from("departments")
      .select("name")
      .eq("id", departmentId)
      .maybeSingle();
    departmentName = (department?.name as string | null) ?? null;
  }

  return {
    workspaceId: ws.id as string,
    role:
      ((membership as Record<string, unknown>).role as
        | "founder"
        | "employee") || "employee",
    cLevelTitle:
      ((membership as Record<string, unknown>).c_level_title as string | null) ??
      null,
    departmentName,
  };
}

/**
 * Require the current user to be allowed to manage marketing operations.
 * Throws when the user is not a founder/CEO/CMO or a Marketing department
 * employee of the Syntaxure Labs workspace.
 */
export async function requireMarketingAccess(
  supabase: SupabaseClientLike,
): Promise<WorkspaceAccess & { workspaceId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const access = await getSyntaxureWorkspaceAccess(supabase, user.id);
  if (!access || !isMarketingAuthorized(access)) {
    throw new Error(
      "Only founders or Marketing department members can manage marketing",
    );
  }
  return access;
}
