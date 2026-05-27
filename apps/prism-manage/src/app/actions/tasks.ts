"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";

export async function getTasks(): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (tasks || []).map((t: Record<string, unknown>) => ({
      id: String(t.id || ""),
      projectId: String(t.project_id || ""),
      title: String(t.title || ""),
      notes: String(t.notes || t.description || ""),
      completed: t.status === "done",
      starred: t.priority ? Number(t.priority) > 0 : false,
      dueDate: t.due_date ? String(t.due_date) : undefined,
      dueTime: t.due_time ? String(t.due_time) : undefined,
      order: Number(t.order || 0),
      createdAt: String(t.created_at || new Date().toISOString()),
      updatedAt: String(t.updated_at || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function createTask(input: {
  title: string;
  projectId: string | number;
  completed?: boolean;
  starred?: boolean;
}) {
  const parsed = CreateTaskSchema.pick({ title: true }).safeParse({
    title: input.title,
    ...(input.completed !== undefined ? { completed: input.completed } : {}),
    ...(input.starred !== undefined ? { starred: input.starred } : {}),
  });
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    project_id: String(input.projectId),
    title: parsed.data.title,
    status: input.completed ? "done" : "todo",
    priority: input.starred ? 1 : 0,
  });

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  if (!taskId) throw new Error("Task ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .update({ status: completed ? "done" : "todo" })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function toggleTaskStar(taskId: string, starred: boolean) {
  if (!taskId) throw new Error("Task ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .update({ priority: starred ? 1 : 0 })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function updateTaskStatus(taskId: string, status: string) {
  if (!taskId) throw new Error("Task ID is required");
  if (!["todo", "done", "in-progress"].includes(status)) {
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
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.completed !== undefined) updateData.status = parsed.data.completed ? "done" : "todo";
  if (parsed.data.starred !== undefined) updateData.priority = parsed.data.starred ? 1 : 0;

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
