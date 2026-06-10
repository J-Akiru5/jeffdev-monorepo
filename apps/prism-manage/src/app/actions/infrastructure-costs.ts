"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  InfrastructureCostSchema, 
  CreateInfrastructureCostSchema,
  type InfrastructureCost,
  type CreateInfrastructureCostInput 
} from "@/lib/schemas";

// 1. Kuhanin ang lahat ng costs para sa isang partikular na period (e.g., "2026-06")
export async function getInfrastructureCosts(workspaceId: string, period: string): Promise<InfrastructureCost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("infrastructure_costs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("period", period)
    .order("service_name", { ascending: true });

  if (error) {
    console.error("Error fetching costs:", error.message);
    throw new Error("Failed to fetch infrastructure costs");
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    serviceName: row.service_name,
    category: row.category as any,
    monthlyBudget: Number(row.monthly_budget),
    actualSpend: Number(row.actual_spend),
    period: row.period,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// 2. Kuhanin ang Summary o kabuuang gastos
export async function getCostSummary(workspaceId: string, period: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("infrastructure_costs")
    .select("category, monthly_budget, actual_spend")
    .eq("workspace_id", workspaceId)
    .eq("period", period);

  if (error) throw new Error("Failed to calculate cost summaries");

  let totalBudget = 0;
  let totalSpend = 0;
  const byCategory: Record<string, { budget: number; spend: number }> = {};

  data?.forEach((row) => {
    const budget = Number(row.monthly_budget || 0);
    const spend = Number(row.actual_spend || 0);

    totalBudget += budget;
    totalSpend += spend;

    // Ligtas na initialization para kay TypeScript
    if (!byCategory[row.category]) {
      byCategory[row.category] = { budget: 0, spend: 0 };
    }
    
    // Gagawa tayo ng block check para alam ni TS na nage-exist ito bago mag-add
    const currentCategory = byCategory[row.category];
    if (currentCategory) {
      currentCategory.budget += budget;
      currentCategory.spend += spend;
    }
  });

  return { totalBudget, totalSpend, byCategory };
}

// 3. Mag-add o mag-edit ng cost record
export async function upsertInfrastructureCost(id: string | undefined, workspaceId: string, input: CreateInfrastructureCostInput) {
  const supabase = await createClient();
  const validated = CreateInfrastructureCostSchema.parse(input);
  const recordId = id || crypto.randomUUID();

  const { error } = await supabase
    .from("infrastructure_costs")
    .upsert({
      id: recordId,
      workspace_id: workspaceId,
      service_name: validated.serviceName,
      category: validated.category,
      monthly_budget: validated.monthlyBudget,
      actual_spend: validated.actualSpend,
      period: validated.period,
      notes: validated.notes,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error saving cost record:", error.message);
    throw new Error("Failed to save cost record");
  }

  revalidatePath("/operations");
}

// 4. Magbura ng cost entry
export async function deleteInfrastructureCost(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("infrastructure_costs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cost entry:", error.message);
    throw new Error("Failed to delete cost record");
  }

  revalidatePath("/operations");
}