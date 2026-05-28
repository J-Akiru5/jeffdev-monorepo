"use server";

/**
 * Agency Notification Server Actions
 * -----------------------------------
 * Server-side operations for managing user notifications.
 */

import { getAdminClient } from "@/lib/supabase/admin";

type NotificationCreateInput = {
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  link?: string;
};

/**
 * Get notifications for a user
 */
export async function getAgencyNotifications(userId: string, limit = 20) {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit) as any);

    if (error || !data) return [];
    return data;
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getAgencyUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = getAdminClient();
    const { count, error } = await (supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false) as any);

    if (error) return 0;
    return count || 0;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAgencyNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    const supabase = getAdminClient() as any;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Failed to mark as read:", error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAgencyNotificationsRead(userId: string): Promise<{ success: boolean }> {
  try {
    const supabase = getAdminClient() as any;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false };
  }
}

/**
 * Dismiss (delete) a notification
 */
export async function dismissAgencyNotification(notificationId: string): Promise<{ success: boolean }> {
  try {
    const supabase = getAdminClient();
    const { error } = await (supabase.from("notifications").delete().eq("id", notificationId) as any);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss notification:", error);
    return { success: false };
  }
}

/**
 * Create a new notification
 */
export async function createAgencyNotification(input: NotificationCreateInput): Promise<{ success: boolean; id?: string }> {
  try {
    const supabase = getAdminClient() as any;
    const { data, error } = await supabase.from("notifications").insert({
      ...input,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false };
  }
}
