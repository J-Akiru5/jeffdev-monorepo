"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  MilestoneSchema, 
  CreateMilestoneSchema, 
  UpdateMilestoneSchema,
  type Milestone,
  type CreateMilestoneInput,
  type UpdateMilestoneInput
} from "@/lib/schemas";

// 1. Kuhanin ang lahat ng Milestones para sa isang Workspace
export async function getMilestones(workspaceId: string): Promise<Milestone[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching milestones:", error.message);
    throw new Error("Failed to fetch milestones");
  }

  // I-map ang database format (snake_case) papunta sa camelCase ng Zod
  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    departmentId: row.department_id,
    title: row.title,
    description: row.description || undefined,
    dueDate: row.due_date || undefined,
    status: row.status,
    deliverables: row.deliverables || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// 2. Kuhanin ang stats ng Milestones (Ilan ang pending, completed, etc.)
export async function getMilestoneStats(workspaceId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("milestones")
    .select("status")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error("Failed to fetch milestone stats");

  const stats = { pending: 0, in_progress: 0, completed: 0, blocked: 0 };
  data?.forEach((row) => {
    if (row.status in stats) {
      stats[row.status as keyof typeof stats]++;
    }
  });

  return stats;
}

// 3. Gumawa ng Bagong Milestone
export async function createMilestone(workspaceId: string, input: CreateMilestoneInput) {
  const supabase = await createClient();
  
  // I-validate ang input gamit ang Zod schema natin kanina
  const validated = CreateMilestoneSchema.parse(input);
  const id = crypto.randomUUID();

  const { error } = await supabase
    .from("milestones")
    .insert({
      id,
      workspace_id: workspaceId,
      department_id: validated.departmentId,
      title: validated.title,
      description: validated.description,
      due_date: validated.dueDate,
      status: validated.status,
      deliverables: validated.deliverables,
    });

  if (error) {
    console.error("Error creating milestone:", error.message);
    throw new Error("Failed to create milestone");
  }

  revalidatePath("/operations");
  return id;
}

// 4. Mag-update ng Existing Milestone
export async function updateMilestone(id: string, input: UpdateMilestoneInput) {
  const supabase = await createClient();
  const validated = UpdateMilestoneSchema.parse(input);

  const { error } = await supabase
    .from("milestones")
    .update({
      title: validated.title,
      description: validated.description,
      due_date: validated.dueDate,
      status: validated.status,
      deliverables: validated.deliverables,
      department_id: validated.departmentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating milestone:", error.message);
    throw new Error("Failed to update milestone");
  }

  revalidatePath("/operations");
}

// 5. Magbura ng Milestone
export async function deleteMilestone(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting milestone:", error.message);
    throw new Error("Failed to delete milestone");
  }

  revalidatePath("/operations");
}