"use server";

/**
 * Agency Messages Server Actions
 * --------------------------------
 * CRUD operations for contact messages.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getAgencyMessages(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[GET AGENCY MESSAGES ERROR]", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function getAgencyMessage(id: string): Promise<any | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error("[GET AGENCY MESSAGE ERROR]", error);
    return null;
  }
}

export async function updateMessageStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: status as "unread" | "read" | "archived", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "contact_messages", resourceId: id, details: { status } });
    revalidatePath("/admin/agency/messages");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE MESSAGE STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function markAllMessagesRead(): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "read" as const, updated_at: new Date().toISOString() })
      .neq("status", "read");
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "contact_messages", resourceId: "bulk", details: { action: "mark_all_read" } });
    revalidatePath("/admin/agency/messages");
    return { success: true };
  } catch (error) {
    console.error("[MARK ALL READ ERROR]", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "DELETE", resource: "contact_messages", resourceId: id });
    revalidatePath("/admin/agency/messages");
    return { success: true };
  } catch (error) {
    console.error("[DELETE MESSAGE ERROR]", error);
    return { success: false, error: "Failed to delete message" };
  }
}
