"use server";

import { createClient as createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TaskFormData {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  deadline?: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  const supabase = await createServer();

  let query = supabase
    .from("pm_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getTask(id: string) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("pm_tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createTask(data: TaskFormData) {
  const supabase = await createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("pm_tasks").insert({
    title: data.title,
    description: data.description || null,
    status: data.status || "todo",
    priority: data.priority || "medium",
    category: data.category || "general",
    deadline: data.deadline || null,
    checklist: data.checklist || [],
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTask(id: string, data: Partial<TaskFormData>) {
  const supabase = await createServer();

  const { error } = await supabase
    .from("pm_tasks")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createServer();

  const { error } = await supabase.from("pm_tasks").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function toggleChecklistItem(
  taskId: string,
  itemId: string,
  completed: boolean
) {
  const supabase = await createServer();

  const { data: task, error: fetchError } = await supabase
    .from("pm_tasks")
    .select("checklist")
    .eq("id", taskId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const checklist = (task.checklist as ChecklistItem[]) || [];
  const updated = checklist.map((item) =>
    item.id === itemId ? { ...item, completed } : item
  );

  const { error } = await supabase
    .from("pm_tasks")
    .update({ checklist: updated, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}
