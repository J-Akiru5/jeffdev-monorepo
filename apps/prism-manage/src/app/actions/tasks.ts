"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Task Server Actions
 * -------------------
 * CRUD operations for tasks backed by Supabase.
 */

export async function getTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return tasks || [];
}

export async function createTask(task: { title: string; projectId: string | number; completed?: boolean; starred?: boolean; order?: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    project_id: task.projectId,
    title: task.title,
    status: task.completed ? "done" : "todo",
    priority: task.starred ? 1 : 0,
  });

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
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

export async function updateTask(taskId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
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
