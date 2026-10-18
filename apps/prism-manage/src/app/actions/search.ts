"use server";

import { createClient } from "@/lib/supabase/server";
import { sanitizeIlikeTerm, toIlikePattern } from "@/lib/postgrest";

export interface TaskSearchResult {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface PageSearchResult {
  id: string;
  title: string;
}

/**
 * Workspace-wide search across tasks (title/description/notes) and pages (title).
 * Used by the command palette. Returns empty results for queries under 2 chars.
 */
export async function searchWorkspace(
  workspaceId: string,
  rawQuery: string,
): Promise<{ tasks: TaskSearchResult[]; pages: PageSearchResult[] }> {
  try {
    const q = sanitizeIlikeTerm(rawQuery);
    if (!workspaceId || q.length < 2) return { tasks: [], pages: [] };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tasks: [], pages: [] };

    const like = toIlikePattern(rawQuery);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, status, priority")
      .eq("workspace_id", workspaceId)
      .or(`title.ilike.${like},description.ilike.${like},notes.ilike.${like}`)
      .order("updated_at", { ascending: false })
      .limit(8);

    const { data: pages } = await supabase
      .from("pages")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .ilike("title", like)
      .limit(5);

    return {
      tasks: (tasks || []).map((t: Record<string, unknown>) => ({
        id: String(t.id),
        title: String(t.title || ""),
        status: String(t.status || ""),
        priority: String(t.priority || ""),
      })),
      pages: (pages || []).map((p: Record<string, unknown>) => ({
        id: String(p.id),
        title: String(p.title || ""),
      })),
    };
  } catch {
    return { tasks: [], pages: [] };
  }
}
