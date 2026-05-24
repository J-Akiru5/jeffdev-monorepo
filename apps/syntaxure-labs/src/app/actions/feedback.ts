"use server";

/**
 * Feedback Server Actions
 * -----------------------
 * CRUD operations for client testimonials/reviews.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import type { FirestoreFeedback, FeedbackStatus } from "@/types/supabase";
import { logAuditEvent } from "@/lib/audit";

const COLLECTION = "feedback";

/**
 * Get all feedback entries
 */
export async function getFeedback(): Promise<FirestoreFeedback[]> {
  try {
    const supabase = getAdminClient() as any;
    const { data, error } = await supabase
      .from(COLLECTION)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
    })) as FirestoreFeedback[];
  } catch (error) {
    console.error("[GET FEEDBACK ERROR]", error);
    return [];
  }
}

/**
 * Get featured/approved feedback for public display
 */
export async function getPublicFeedback(): Promise<FirestoreFeedback[]> {
  try {
    const supabase = getAdminClient() as any;
    const { data, error } = await supabase
      .from(COLLECTION)
      .select("*")
      .in("status", ["approved", "featured"])
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
    })) as FirestoreFeedback[];
  } catch (error) {
    console.error("[GET PUBLIC FEEDBACK ERROR]", error);
    return [];
  }
}

/**
 * Create a new feedback entry
 */
export async function createFeedback(
  data: Omit<
    FirestoreFeedback,
    "id" | "created_at" | "updated_at" | "status" | "featured"
  >,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const feedback: Omit<FirestoreFeedback, "id"> = {
      ...data,
      status: "pending",
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getAdminClient() as any;
    const { data: result, error } = await supabase
      .from(COLLECTION)
      .insert(feedback)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "feedback",
      resourceId: result.id,
      details: { clientName: data.clientName },
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error("[CREATE FEEDBACK ERROR]", error);
    return { success: false, error: "Failed to create feedback" };
  }
}

/**
 * Update feedback status
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient() as any;
    const { error } = await supabase
      .from(COLLECTION)
      .update({
        status,
        featured: status === "featured",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "STATUS_CHANGE",
      resource: "feedback",
      resourceId: id,
      details: { status },
    });

    return { success: true };
  } catch (error) {
    console.error("[UPDATE FEEDBACK STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Delete feedback
 */
export async function deleteFeedback(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient() as any;
    const { error } = await supabase.from(COLLECTION).delete().eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "feedback",
      resourceId: id,
    });

    return { success: true };
  } catch (error) {
    console.error("[DELETE FEEDBACK ERROR]", error);
    return { success: false, error: "Failed to delete feedback" };
  }
}
