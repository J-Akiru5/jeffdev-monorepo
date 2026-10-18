"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireBmcViewAccess, requireOperationsAccess } from "@/lib/authorization-server";
import { BMC_BLOCK_KEYS, BMC_SEED, type BmcBlockKey } from "@/lib/bmc-blocks";
import type { Json } from "@/types/database.types";

// =============================================================================
// TYPES
// =============================================================================

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface Milestone {
  id: string;
  workspaceId: string;
  departmentId: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  deliverables: string[];
  createdAt: string;
  updatedAt: string;
}

export type CostCategory = "hosting" | "database" | "ai_api" | "dev_tools" | "other";

export interface InfrastructureCost {
  id: string;
  serviceName: string;
  category: CostCategory;
  monthlyBudget: number;
  actualSpend: number;
  period: string;
  notes: string | null;
  createdAt: string;
}

export interface BmcSectionData {
  block: BmcBlockKey;
  content: string;
  updatedAt: string | null;
}

function mapMilestone(raw: Record<string, unknown>): Milestone {
  return {
    id: String(raw.id),
    workspaceId: String(raw.workspace_id),
    departmentId: raw.department_id ? String(raw.department_id) : null,
    title: String(raw.title || ""),
    description: raw.description ? String(raw.description) : null,
    dueDate: raw.due_date ? String(raw.due_date) : null,
    status: (raw.status as MilestoneStatus) || "pending",
    deliverables: Array.isArray(raw.deliverables) ? (raw.deliverables as string[]) : [],
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

function mapCost(raw: Record<string, unknown>): InfrastructureCost {
  return {
    id: String(raw.id),
    serviceName: String(raw.service_name || ""),
    category: (raw.category as CostCategory) || "other",
    monthlyBudget: Number(raw.monthly_budget || 0),
    actualSpend: Number(raw.actual_spend || 0),
    period: String(raw.period || ""),
    notes: raw.notes ? String(raw.notes) : null,
    createdAt: String(raw.created_at),
  };
}

// =============================================================================
// MILESTONES (CEO/COO)
// =============================================================================

export async function getMilestones(): Promise<Milestone[]> {
  try {
    const supabase = await createClient();
    const access = await requireOperationsAccess(supabase);

    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("workspace_id", access.workspaceId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    return (data || []).map(mapMilestone);
  } catch {
    return [];
  }
}

export async function createMilestone(input: {
  title: string;
  description?: string;
  dueDate?: string;
  status?: MilestoneStatus;
  deliverables?: string[];
  departmentId?: string | null;
}): Promise<{ success?: boolean; error?: string }> {
  const title = input.title.trim();
  if (!title || title.length > 300) {
    return { error: "Milestone title must be 1-300 characters" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access = await requireOperationsAccess(supabase);

    const { error } = await supabase.from("milestones").insert({
      workspace_id: access.workspaceId,
      department_id: input.departmentId || null,
      title,
      description: input.description || null,
      ...(input.dueDate ? { due_date: input.dueDate } : {}),
      status: input.status || "pending",
      deliverables: input.deliverables || [],
      created_by: user?.id || null,
    });
    if (error) return { error: error.message };

    revalidatePath("/operations");
    revalidatePath("/operations/milestones");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create milestone" };
  }
}

export async function updateMilestone(
  id: string,
  updates: {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: MilestoneStatus;
    deliverables?: string[];
    departmentId?: string | null;
  },
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    await requireOperationsAccess(supabase);

    const update: Record<string, unknown> = {};
    if (updates.title !== undefined) {
      const title = updates.title.trim();
      if (!title || title.length > 300) {
        return { error: "Milestone title must be 1-300 characters" };
      }
      update.title = title;
    }
    if (updates.description !== undefined) update.description = updates.description || null;
    if (updates.dueDate !== undefined) update.due_date = updates.dueDate || null;
    if (updates.status !== undefined) update.status = updates.status;
    if (updates.deliverables !== undefined) update.deliverables = updates.deliverables;
    if (updates.departmentId !== undefined) update.department_id = updates.departmentId || null;
    if (Object.keys(update).length === 0) return { success: true };

    const { data, error } = await supabase
      .from("milestones")
      // Dynamic update builder — loose cast until payload types are tightened.
      .update(update as never)
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Milestone not found" };

    revalidatePath("/operations");
    revalidatePath("/operations/milestones");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update milestone" };
  }
}

export async function deleteMilestone(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    await requireOperationsAccess(supabase);

    const { data, error } = await supabase
      .from("milestones")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Milestone not found" };

    revalidatePath("/operations");
    revalidatePath("/operations/milestones");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete milestone" };
  }
}

// =============================================================================
// INFRASTRUCTURE COSTS (CEO/COO)
// =============================================================================

export async function getInfrastructureCosts(period?: string): Promise<InfrastructureCost[]> {
  try {
    const supabase = await createClient();
    const access = await requireOperationsAccess(supabase);

    let query = supabase
      .from("infrastructure_costs")
      .select("*")
      .eq("workspace_id", access.workspaceId)
      .order("category", { ascending: true })
      .order("service_name", { ascending: true });

    if (period) query = query.eq("period", period);

    const { data } = await query;
    return (data || []).map(mapCost);
  } catch {
    return [];
  }
}

export async function upsertCost(input: {
  id?: string;
  serviceName: string;
  category: CostCategory;
  monthlyBudget: number;
  actualSpend: number;
  period: string;
  notes?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const serviceName = input.serviceName.trim();
  if (!serviceName || serviceName.length > 120) {
    return { error: "Service name must be 1-120 characters" };
  }
  if (!/^\d{4}-\d{2}$/.test(input.period)) {
    return { error: "Period must be YYYY-MM" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access = await requireOperationsAccess(supabase);

    const row = {
      workspace_id: access.workspaceId,
      service_name: serviceName,
      category: input.category,
      monthly_budget: input.monthlyBudget || 0,
      actual_spend: input.actualSpend || 0,
      period: input.period,
      notes: input.notes || null,
    };

    if (input.id) {
      const { data, error } = await supabase
        .from("infrastructure_costs")
        .update(row)
        .eq("id", input.id)
        .select("id");
      if (error) return { error: error.message };
      if (!data || data.length === 0) return { error: "Cost entry not found" };
    } else {
      const { error } = await supabase
        .from("infrastructure_costs")
        .insert({ id: crypto.randomUUID(), ...row, created_by: user?.id || null });
      if (error) return { error: error.message };
    }

    revalidatePath("/operations");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save cost" };
  }
}

export async function deleteCost(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    await requireOperationsAccess(supabase);

    const { data, error } = await supabase
      .from("infrastructure_costs")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Cost entry not found" };

    revalidatePath("/operations");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete cost" };
  }
}

// =============================================================================
// BUSINESS MODEL CANVAS
// =============================================================================

export async function getBmcSections(): Promise<BmcSectionData[]> {
  try {
    const supabase = await createClient();
    const access = await requireBmcViewAccess(supabase);

    const { data } = await supabase
      .from("bmc_sections")
      .select("block, content, updated_at")
      .eq("workspace_id", access.workspaceId);

    const byBlock = new Map(
      (data || []).map((row: Record<string, unknown>) => [
        String(row.block),
        { content: String(row.content || ""), updatedAt: String(row.updated_at) },
      ]),
    );

    return BMC_BLOCK_KEYS.map((block) => {
      const existing = byBlock.get(block);
      return {
        block,
        content: existing?.content || "",
        updatedAt: existing?.updatedAt || null,
      };
    });
  } catch {
    return BMC_BLOCK_KEYS.map((block) => ({ block, content: "", updatedAt: null }));
  }
}

export async function upsertBmcSection(
  block: BmcBlockKey,
  content: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!BMC_BLOCK_KEYS.includes(block)) {
    return { error: "Unknown canvas block" };
  }
  if (content.length > 5000) {
    return { error: "Block content is too long (max 5000 characters)" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access = await requireOperationsAccess(supabase);

    const { error } = await supabase
      .from("bmc_sections")
      .upsert(
        {
          id: crypto.randomUUID(),
          workspace_id: access.workspaceId,
          block,
          content: content as Json,
          updated_by: user?.id || null,
        },
        { onConflict: "workspace_id,block" },
      );
    if (error) return { error: error.message };

    revalidatePath("/bmc");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save block" };
  }
}

export async function seedBmcData(): Promise<{ success?: boolean; error?: string; inserted?: number }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access = await requireOperationsAccess(supabase);

    const { data: existing } = await supabase
      .from("bmc_sections")
      .select("block")
      .eq("workspace_id", access.workspaceId);

    const existingBlocks = new Set(
      (existing || []).map((row: Record<string, unknown>) => String(row.block)),
    );
    const missing = BMC_BLOCK_KEYS.filter((block) => !existingBlocks.has(block));
    if (missing.length === 0) return { success: true, inserted: 0 };

    const { error } = await supabase.from("bmc_sections").insert(
      missing.map((block) => ({
        id: crypto.randomUUID(),
        workspace_id: access.workspaceId,
        block,
        content: BMC_SEED[block] as Json,
        updated_by: user?.id || null,
      })),
    );
    if (error) return { error: error.message };

    revalidatePath("/bmc");
    return { success: true, inserted: missing.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to seed canvas" };
  }
}
