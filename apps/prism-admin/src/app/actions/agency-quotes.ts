"use server";

/**
 * Agency Quotes Server Actions
 * -----------------------------
 * CRUD operations for quote requests.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const quoteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  company: z.string().max(100).optional().default(""),
  phone: z.string().max(50).optional().default(""),
  template_selected: z.string().max(100).optional().default(""),
  customization_scope: z.string().max(50).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  status: z.string().default("new"),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getAgencyQuotes(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[GET AGENCY QUOTES ERROR]", error);
    return { success: false, error: "Failed to fetch quotes" };
  }
}

export async function getAgencyQuote(id: string): Promise<unknown | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error("[GET AGENCY QUOTE ERROR]", error);
    return null;
  }
}

export async function updateAgencyQuote(id: string, data: Partial<QuoteFormData>): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.company !== undefined) updatePayload.company = data.company;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.template_selected !== undefined) updatePayload.template_selected = data.template_selected;
    if (data.customization_scope !== undefined) updatePayload.customization_scope = data.customization_scope;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.status !== undefined) updatePayload.status = data.status;

    const { error } = await supabase.from("quotes").update(updatePayload).eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "quotes", resourceId: id, details: { status: data.status } });
    revalidatePath("/admin/agency/quotes");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE AGENCY QUOTE ERROR]", error);
    return { success: false, error: "Failed to update quote" };
  }
}

export async function updateQuoteStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("quotes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "quotes", resourceId: id, details: { status } });
    revalidatePath("/admin/agency/quotes");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE QUOTE STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteAgencyQuote(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "DELETE", resource: "quotes", resourceId: id });
    revalidatePath("/admin/agency/quotes");
    return { success: true };
  } catch (error) {
    console.error("[DELETE AGENCY QUOTE ERROR]", error);
    return { success: false, error: "Failed to delete quote" };
  }
}
