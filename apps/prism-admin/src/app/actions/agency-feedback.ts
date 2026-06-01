"use server";

/**
 * Agency Feedback Server Actions
 * --------------------------------
 * CRUD operations for feedback entries.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getAgencyFeedback(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[GET AGENCY FEEDBACK ERROR]", error);
    return { success: false, error: "Failed to fetch feedback" };
  }
}

export async function getAgencyFeedbackItem(id: string): Promise<any | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error("[GET AGENCY FEEDBACK ITEM ERROR]", error);
    return null;
  }
}

export async function updateFeedbackStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("feedback")
      .update({ status: status as "received" | "acknowledged" | "resolved" | "archived", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "feedback", resourceId: id, details: { status } });
    revalidatePath("/admin/agency/feedback");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE FEEDBACK STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteFeedback(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "DELETE", resource: "feedback", resourceId: id });
    revalidatePath("/admin/agency/feedback");
    return { success: true };
  } catch (error) {
    console.error("[DELETE FEEDBACK ERROR]", error);
    return { success: false, error: "Failed to delete feedback" };
  }
}
