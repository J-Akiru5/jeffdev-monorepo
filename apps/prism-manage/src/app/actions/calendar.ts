"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CalendarEventSchema, UpdateCalendarEventSchema } from "@/lib/schemas";
import type { CalendarEvent } from "@/lib/schemas";
import {
  deleteEventFromGoogleCalendar,
  pushEventToGoogleCalendar,
  pullGoogleEvents,
} from "@/lib/google-calendar";

export async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true });

    return (events || []).map(normalizeEvent);
  } catch {
    return [];
  }
}

export async function createEvent(event: {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  description?: string;
  linkedTaskId?: string;
}): Promise<CalendarEvent> {
  const parsed = CalendarEventSchema.pick({
    title: true,
    start: true,
    end: true,
    allDay: true,
    linkedTaskId: true,
  }).safeParse({
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay ?? false,
    ...(event.linkedTaskId ? { linkedTaskId: event.linkedTaskId } : {}),
  });
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      start_time: parsed.data.start,
      end_time: parsed.data.end,
      all_day: parsed.data.allDay,
      description: event.description || null,
      linked_task_id: parsed.data.linkedTaskId || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Mirror to Google Calendar (best-effort — never blocks the local save)
  await pushEventToGoogleCalendar(user.id, {
    id: String(data.id),
    title: parsed.data.title,
    start: parsed.data.start,
    end: parsed.data.end,
    allDay: parsed.data.allDay,
    description: event.description || null,
  });

  revalidatePath("/calendar");
  return normalizeEvent(data);
}

export async function updateEvent(
  eventId: string,
  data: Record<string, unknown>,
): Promise<CalendarEvent> {
  if (!eventId) throw new Error("Event ID is required");

  const parsed = UpdateCalendarEventSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.start !== undefined) updateData.start_time = parsed.data.start;
  if (parsed.data.end !== undefined) updateData.end_time = parsed.data.end;
  if (parsed.data.allDay !== undefined) updateData.all_day = parsed.data.allDay;
  if (parsed.data.linkedTaskId !== undefined) updateData.linked_task_id = parsed.data.linkedTaskId;

  const { data: updated, error } = await supabase
    .from("calendar_events")
    .update(updateData as never)
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  // Mirror the change to Google Calendar (best-effort)
  await pushEventToGoogleCalendar(user.id, {
    id: String(updated.id),
    title: String(updated.title || ""),
    start: String(updated.start_time || ""),
    end: String(updated.end_time || ""),
    allDay: Boolean(updated.all_day),
    description: (updated.description as string) || null,
  });

  revalidatePath("/calendar");
  return normalizeEvent(updated);
}

export async function deleteEvent(eventId: string) {
  if (!eventId) throw new Error("Event ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: row } = await supabase
    .from("calendar_events")
    .select("google_calendar_id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) throw error;

  if (row?.google_calendar_id) {
    await deleteEventFromGoogleCalendar(user.id, String(row.google_calendar_id));
  }

  revalidatePath("/calendar");
}

/**
 * Real two-way sync: pull Google events and reconcile local rows.
 * prism-manage stays authoritative for task-mirrored events.
 */
export async function syncCalendar(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated. Connect Google Calendar first.");
  }

  const result = await pullGoogleEvents(user.id);
  if (result.error) {
    throw new Error(result.error);
  }

  return fetchEvents();
}

/** Connection + last-sync status for the UI. */
export async function getCalendarSyncStatus(): Promise<{
  connected: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { connected: false, lastSyncedAt: null, lastError: null };

    const { data: token } = await supabase
      .from("user_tokens")
      .select("metadata")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    const metadata = (token?.metadata as Record<string, unknown>) || {};
    return {
      connected: !!token,
      lastSyncedAt: metadata.last_synced_at
        ? String(metadata.last_synced_at)
        : null,
      lastError: metadata.last_sync_error ? String(metadata.last_sync_error) : null,
    };
  } catch {
    return { connected: false, lastSyncedAt: null, lastError: null };
  }
}

function normalizeEvent(raw: Record<string, unknown>): CalendarEvent {
  return {
    id: String(raw.id || ""),
    title: String(raw.title || ""),
    start: String(raw.start_time || raw.start || ""),
    end: String(raw.end_time || raw.end || ""),
    allDay: Boolean(raw.all_day || raw.allDay || false),
    googleCalendarId: String(raw.google_calendar_id || raw.googleCalendarId || ""),
    linkedTaskId: (raw.linked_task_id || raw.linkedTaskId) as string | undefined,
    syncedAt: String(raw.synced_at || raw.syncedAt || new Date().toISOString()),
  };
}

export async function disconnectCalendar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("user_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "google");

  if (error) throw error;
  revalidatePath("/settings");
}
