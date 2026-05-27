"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";

/**
 * Map a raw Supabase row (snake_case) to the Task type (camelCase).
 */
function mapTask(raw: Record<string, unknown>): Task {
  return {
    id: String(raw.id || ""),
    projectId: String(raw.project_id || raw.projectId || ""),
    workspaceId: raw.workspace_id ? String(raw.workspace_id) : undefined,
    departmentId: raw.department_id ? String(raw.department_id) : undefined,
    title: String(raw.title || ""),

    // Classification
    taskType: (raw.task_type as Task["taskType"]) || "uncategorized",
    status: (raw.status as Task["status"]) || "backlog",
    priority: (raw.priority as Task["priority"]) || "medium",

    // Content
    description: raw.description ? String(raw.description) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,

    // Metadata
    isStarred: raw.is_starred === true || raw.is_starred === "true" || false,
    assignedTo: raw.assigned_to ? String(raw.assigned_to) : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,

    // Dates
    dueDate: raw.due_date ? String(raw.due_date) : undefined,
    dueTime: raw.due_time ? String(raw.due_time) : undefined,
    googleEventId: raw.google_event_id ? String(raw.google_event_id) : undefined,

    // Ordering
    order: Number(raw.order || 0),
    pathIndex: Number(raw.path_index || 0),

    // Timestamps
    createdAt: String(raw.created_at || raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updated_at || raw.updatedAt || new Date().toISOString()),
  };
}

/**
 * Map Task to Supabase insert format (snake_case).
 */
function toDbInsert(task: Partial<Task> & { user_id: string; project_id: string }) {
  const db: Record<string, unknown> = {
    user_id: task.user_id,
    project_id: task.project_id,
    title: task.title,
    task_type: task.taskType || "uncategorized",
    status: task.status || "backlog",
    priority: task.priority || "medium",
    is_starred: task.isStarred || false,
  };

  if (task.workspaceId !== undefined) db.workspace_id = task.workspaceId;
  if (task.departmentId !== undefined) db.department_id = task.departmentId;
  if (task.description !== undefined) db.description = task.description;
  if (task.notes !== undefined) db.notes = task.notes;
  if (task.assignedTo !== undefined) db.assigned_to = task.assignedTo;
  if (task.tags !== undefined) db.tags = task.tags;
  if (task.dueDate !== undefined) db.due_date = task.dueDate;
  if (task.dueTime !== undefined) db.due_time = task.dueTime;
  if (task.order !== undefined) db.order = task.order;
  if (task.pathIndex !== undefined) db.path_index = task.pathIndex;

  return db;
}

export async function getTasks(workspaceId?: string): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by workspace if specified
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      // Default: tasks owned by user or in their workspaces
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      const wsIds = (memberships || []).map((m: Record<string, unknown>) => m.workspace_id);
      if (wsIds.length > 0) {
        query = query.or(`workspace_id.in.(${wsIds.join(",")}),user_id.eq.${user.id}`);
      } else {
        query = query.eq("user_id", user.id);
      }
    }

    const { data: tasks } = await query;
    return (tasks || []).map((t: Record<string, unknown>) => mapTask(t));
  } catch {
    return [];
  }
}

export async function createTask(input: {
  title: string;
  projectId: string | number;
  workspaceId?: string;
  departmentId?: string;
  taskType?: Task["taskType"];
  status?: Task["status"];
  priority?: Task["priority"];
  description?: string;
  notes?: string;
  isStarred?: boolean;
  assignedTo?: string;
  tags?: string[];
  dueDate?: string;
  dueTime?: string;
}) {
  const parsed = CreateTaskSchema.pick({ title: true }).safeParse({
    title: input.title,
  });
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  // Validate taskType against the enum if provided
  const validTypes = ["feature", "nice-to-have", "bug", "error", "uncategorized"];
  if (input.taskType && !validTypes.includes(input.taskType)) {
    throw new Error("Invalid task type");
  }

  // Validate status against the new workflow enum
  const validStatuses = ["backlog", "todo", "in_progress", "in_review", "approved"];
  if (input.status && !validStatuses.includes(input.status)) {
    throw new Error("Invalid status");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbRecord = toDbInsert({
    user_id: user.id,
    project_id: String(input.projectId),
    title: parsed.data.title,
    workspaceId: input.workspaceId,
    departmentId: input.departmentId,
    taskType: input.taskType || "uncategorized",
    status: input.status || "backlog",
    priority: input.priority || "medium",
    isStarred: input.isStarred || false,
    description: input.description,
    notes: input.notes,
    assignedTo: input.assignedTo,
    tags: input.tags,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
  });

  const { error } = await supabase.from("tasks").insert(dbRecord);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  if (!taskId) throw new Error("Task ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const newStatus = completed ? "approved" : "backlog";

  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function toggleTaskStar(taskId: string, isStarred: boolean) {
  if (!taskId) throw new Error("Task ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .update({ is_starred: isStarred })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function updateTaskStatus(taskId: string, status: string) {
  if (!taskId) throw new Error("Task ID is required");

  const validStatuses = ["backlog", "todo", "in_progress", "in_review", "approved"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function updateTask(
  taskId: string,
  data: Record<string, unknown>,
) {
  if (!taskId) throw new Error("Task ID is required");

  const parsed = UpdateTaskSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.taskType !== undefined) updateData.task_type = parsed.data.taskType;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.isStarred !== undefined) updateData.is_starred = parsed.data.isStarred;
  if (parsed.data.assignedTo !== undefined) updateData.assigned_to = parsed.data.assignedTo;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
  if (parsed.data.dueDate !== undefined) updateData.due_date = parsed.data.dueDate;
  if (parsed.data.dueTime !== undefined) updateData.due_time = parsed.data.dueTime;
  if (parsed.data.order !== undefined) updateData.order = parsed.data.order;
  if (parsed.data.pathIndex !== undefined) updateData.path_index = parsed.data.pathIndex;
  if (parsed.data.workspaceId !== undefined) updateData.workspace_id = parsed.data.workspaceId;
  if (parsed.data.departmentId !== undefined) updateData.department_id = parsed.data.departmentId;

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  if (!taskId) throw new Error("Task ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}
