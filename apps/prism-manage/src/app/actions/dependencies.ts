"use server";

/**
 * Task dependencies (arc 3 · D4)
 * ------------------------------
 * blocker → blocked edges with a cycle guard. Approval of a blocked task is
 * gated in the task actions; this module owns the edges themselves.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/log";

export interface DependencyTask {
  id: string;
  title: string;
  status: string;
}

export async function getTaskDependencies(
  taskId: string,
): Promise<{ blockers: DependencyTask[]; blocking: DependencyTask[] }> {
  const supabase = await createClient();
  const [blockersRes, blockingRes] = await Promise.all([
    supabase
      .from("task_dependencies")
      .select("blocker:tasks!blocker_id(id, title, status)")
      .eq("blocked_id", taskId),
    supabase
      .from("task_dependencies")
      .select("blocked:tasks!blocked_id(id, title, status)")
      .eq("blocker_id", taskId),
  ]);

  const map = (rows: unknown[] | null, key: string): DependencyTask[] =>
    (rows || [])
      .map((r) => (r as Record<string, unknown>)[key] as DependencyTask | null)
      .filter((t): t is DependencyTask => !!t);

  return {
    blockers: map(blockersRes.data, "blocker"),
    blocking: map(blockingRes.data, "blocked"),
  };
}

/** Task ids (from the given list) that have at least one open blocker. */
export async function getBlockedTaskIds(taskIds: string[]): Promise<string[]> {
  if (taskIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_dependencies")
    .select("blocked_id, blocker:tasks!blocker_id(status)")
    .in("blocked_id", taskIds);

  const blocked = new Set<string>();
  for (const row of data || []) {
    const blocker = row.blocker as { status?: string } | null;
    if (blocker && blocker.status !== "approved") {
      blocked.add(String(row.blocked_id));
    }
  }
  return [...blocked];
}

export async function addTaskDependency(
  blockerId: string,
  blockedId: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!blockerId || !blockedId || blockerId === blockedId) {
    return { error: "Pick a different task" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, workspace_id")
    .in("id", [blockerId, blockedId]);
  if (!tasks || tasks.length !== 2) {
    return { error: "Task not found or you don't have access" };
  }
  if (tasks[0]!.workspace_id !== tasks[1]!.workspace_id) {
    return { error: "Tasks must be in the same workspace" };
  }

  // Cycle guard: reject when blockedId already (transitively) blocks blockerId.
  const { data: edges } = await supabase
    .from("task_dependencies")
    .select("blocker_id, blocked_id");
  const adjacency = new Map<string, string[]>();
  for (const e of edges || []) {
    const from = String(e.blocker_id);
    const list = adjacency.get(from) || [];
    list.push(String(e.blocked_id));
    adjacency.set(from, list);
  }
  const stack = [blockedId];
  const seen = new Set<string>();
  while (stack.length) {
    const node = stack.pop()!;
    if (node === blockerId) {
      return { error: "That would create a circular dependency" };
    }
    if (seen.has(node)) continue;
    seen.add(node);
    stack.push(...(adjacency.get(node) || []));
  }

  const { error } = await supabase.from("task_dependencies").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
    created_by: user.id,
  } as never);

  if (error) {
    if (error.code === "23505") return { error: "That dependency already exists" };
    return { error: error.message };
  }

  logger.info("dependency.added", { blockerId, blockedId });
  revalidatePath("/tasks");
  return { success: true };
}

export async function removeTaskDependency(
  blockerId: string,
  blockedId: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) return { error: error.message };

  logger.info("dependency.removed", { blockerId, blockedId });
  revalidatePath("/tasks");
  return { success: true };
}
