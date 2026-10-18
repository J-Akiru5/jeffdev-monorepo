import type { Project } from "@/lib/schemas";

/**
 * pm_projects shared helpers
 * --------------------------
 * Used by both `actions/projects.ts` (list CRUD) and `actions/tasks.ts`
 * (task creation needs a default list). Not a "use server" module — plain
 * functions that take a Supabase client.
 */

/** Map a raw pm_projects row (snake_case) to the Project type (camelCase). */
export function mapProject(raw: Record<string, unknown>): Project {
  return {
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    color: raw.color ? String(raw.color) : undefined,
    icon: raw.icon ? String(raw.icon) : undefined,
    order: Number(raw.sort_order || 0),
    createdAt: String(raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updated_at || new Date().toISOString()),
  };
}

/**
 * Get (or lazily create) the default "General" list for a workspace.
 * Used when a task is created without an explicit list, and when a list is
 * deleted and its tasks need re-homing.
 */
export async function getOrCreateDefaultProject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workspaceId: string,
  userId: string,
): Promise<{ id: string; workspaceId: string } | null> {
  const { data: existing } = await supabase
    .from("pm_projects")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", "General")
    .eq("status", "active")
    .maybeSingle();

  if (existing) return { id: String(existing.id), workspaceId };

  const { data: created, error } = await supabase
    .from("pm_projects")
    .insert({
      workspace_id: workspaceId,
      name: "General",
      color: "var(--color-cyan)",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return { id: String(created.id), workspaceId };
}
