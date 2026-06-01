"use server";

/**
 * Agency Availability Server Actions
 * ------------------------------------
 * CRUD operations for availability slots.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getAgencyAvailability(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("agency_availability")
      .select("*")
      .order("date", { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[GET AGENCY AVAILABILITY ERROR]", error);
    return { success: false, error: "Failed to fetch availability" };
  }
}

export async function createAvailabilitySlot(slot: {
  date: string;
  startTime: string;
  endTime: string;
  type?: string;
  note?: string;
}): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("agency_availability").insert({
      date: slot.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      type: (slot.type || "available") as "available" | "busy" | "unavailable" | "tentative",
      note: slot.note || "",
    });
    if (error) throw error;

    await logAuditEvent({ action: "CREATE", resource: "agency_availability", resourceId: slot.date });
    revalidatePath("/admin/agency/availability");
    return { success: true };
  } catch (error) {
    console.error("[CREATE AVAILABILITY SLOT ERROR]", error);
    return { success: false, error: "Failed to create slot" };
  }
}

export async function updateAvailabilitySlot(
  id: string,
  slot: { startTime: string; endTime: string; type: string; note: string }
): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("agency_availability")
      .update({
        start_time: slot.startTime,
        end_time: slot.endTime,
        type: slot.type as "available" | "busy" | "unavailable" | "tentative",
        note: slot.note,
      })
      .eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "agency_availability", resourceId: id });
    revalidatePath("/admin/agency/availability");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE AVAILABILITY SLOT ERROR]", error);
    return { success: false, error: "Failed to update slot" };
  }
}

export async function deleteAvailabilitySlot(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("agency_availability").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "DELETE", resource: "agency_availability", resourceId: id });
    revalidatePath("/admin/agency/availability");
    return { success: true };
  } catch (error) {
    console.error("[DELETE AVAILABILITY SLOT ERROR]", error);
    return { success: false, error: "Failed to delete slot" };
  }
}
