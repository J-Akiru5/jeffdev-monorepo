import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolved workspace data for the Syntaxure Labs workspace.
 * Returned by `resolveSyntaxureWorkspace()`.
 */
export interface ResolvedWorkspace {
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  departments: { id: string; name: string }[];
  userRole: "founder" | "employee";
  userId: string;
}

/**
 * Resolve the Syntaxure Labs workspace for the current user.
 *
 * Uses React.cache() so multiple callers within the same server render
 * share a single Supabase query. Returns null if:
 * - User is not authenticated
 * - User has no membership in a "Syntaxure Labs" workspace
 */
export const resolveSyntaxureWorkspace = cache(async (): Promise<ResolvedWorkspace | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select(
      "workspace_id, role, department_id, workspaces!inner(id, name, created_at)",
    )
    .eq("user_id", user.id);

  if (!memberships) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syntaxureMembership = memberships.find((m: any) => {
    const ws = m.workspaces;
    if (!ws) return false;
    return ws.name === "Syntaxure Labs" || ws.name === "Syntaxure Labs, Inc.";
  });

  if (!syntaxureMembership) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws = syntaxureMembership.workspaces as any;

  const { data: deptData } = await supabase
    .from("departments")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("name", { ascending: true });

  return {
    workspaceId: ws.id as string,
    workspaceName: ws.name as string,
    createdAt: ws.created_at as string,
    departments: (deptData || []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      name: String(d.name),
    })),
    userRole: (syntaxureMembership.role as "founder" | "employee") || "employee",
    userId: user.id,
  };
});
