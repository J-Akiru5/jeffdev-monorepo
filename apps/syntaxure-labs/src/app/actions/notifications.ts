"use server";

/**
 * Notification Server Actions
 * ---------------------------
 * Server-side operations for managing user notifications.
 *
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
 * NOTE: Type casting with 'as any' is used due to Supabase's limitation with
 * dynamically determined table schemas. The actual runtime behavior is correct.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationCreateInput = {
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  link?: string;
};

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  limit = 20,
): Promise<Notification[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = (await supabase
      .from(NOTIFICATIONS_COLLECTION)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .limit(limit)) as any;

    if (error || !data) return [];

    return data as Notification[];
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = getAdminClient();
    const { count, error } = (await supabase
      .from(NOTIFICATIONS_COLLECTION)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("read", false)) as any;

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
export async function markAsRead(
  notificationId: string,
): Promise<{ success: boolean }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { error } = (await supabase
      .from(NOTIFICATIONS_COLLECTION)
      .update({ read: true })
      .eq("id", notificationId)) as any;

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
export async function markAllAsRead(
  userId: string,
): Promise<{ success: boolean }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { error } = (await supabase
      .from(NOTIFICATIONS_COLLECTION)
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)) as any;

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
export async function dismissNotification(
  notificationId: string,
): Promise<{ success: boolean }> {
  try {
    const supabase = getAdminClient();
    const { error } = (await supabase
      .from(NOTIFICATIONS_COLLECTION)
      .delete()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", notificationId)) as any;

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss notification:", error);
    return { success: false };
  }
}

/**
 * Create a new notification
 * This is typically called from other server actions when events occur.
 */
export async function createNotification(
  input: NotificationCreateInput,
): Promise<{ success: boolean; id?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { data, error } = (await supabase
      .from(NOTIFICATIONS_COLLECTION)
      .insert({
        ...input,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()) as any;

    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false };
  }
}
