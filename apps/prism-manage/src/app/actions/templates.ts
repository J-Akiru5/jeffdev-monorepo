"use server";

/**
 * Task templates (arc 3 · D1)
 * ---------------------------
 * Save a task's shape as a workspace template; apply it when creating.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/log";
import type { Json } from "@/types/database.types";

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  taskType: string;
  priority: string;
  description: string | null;
  tags: string[];
  projectId: string | null;
}

function mapTemplate(row: Record<string, unknown>): TaskTemplate {
  return {
    id: String(row.id),
    name: String(row.name),
    title: String(row.title),
    taskType: String(row.task_type),
    priority: String(row.priority),
    description: row.description ? String(row.description) : null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    projectId: row.pm_project_id ? String(row.pm_project_id) : null,
  };
}

export async function getTaskTemplates(
  workspaceId: string,
): Promise<TaskTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_templates")
    .select("id, name, title, task_type, priority, description, tags, pm_project_id")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  return (data || []).map(mapTemplate);
}

export async function saveTaskAsTemplate(
  taskId: string,
  name: string,
): Promise<{ success?: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) {
    return { error: "Template name must be 1-100 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: task } = await supabase
    .from("tasks")
    .select(
      "id, title, task_type, priority, description, pm_project_id, workspace_id",
    )
    .eq("id", taskId)
    .maybeSingle();
  if (!task || !task.workspace_id) {
    return { error: "Task not found or you don't have access" };
  }

  // Snapshot tags via the junction table
  const { data: tagRows } = await supabase
    .from("task_tags")
    .select("tags(name)")
    .eq("task_id", taskId);
  const tags = (tagRows || [])
    .map(
      (row: Record<string, unknown>) =>
        (row.tags as Record<string, unknown>)?.name as string,
    )
    .filter(Boolean);

  const { error } = await supabase.from("task_templates").insert({
    workspace_id: task.workspace_id,
    created_by: user.id,
    name: trimmed,
    title: task.title,
    task_type: task.task_type ?? "uncategorized",
    priority: task.priority ?? "medium",
    description: task.description,
    tags: tags as unknown as Json,
    pm_project_id: task.pm_project_id,
  } as never);

  if (error) {
    logger.error("template.save.failed", { error: error.message });
    return { error: error.message };
  }

  logger.info("template.saved", { taskId, workspaceId: task.workspace_id });
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTaskTemplate(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("task_templates")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}
