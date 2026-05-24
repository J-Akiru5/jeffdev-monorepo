"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CalendarEvent } from "@/lib/schemas";

/**
 * Calendar Server Actions
 * -----------------------
 * CRUD operations for calendar events backed by Supabase.
 */

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  return (events || []).map(normalizeEvent);
}

export async function createEvent(event: {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  description?: string;
  linkedTaskId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: event.title,
      start_time: event.start,
      end_time: event.end,
      all_day: event.allDay || false,
      description: event.description || null,
      linked_task_id: event.linkedTaskId || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/calendar");
  return normalizeEvent(data);
}

interface DatabaseEvent {
  id: string | number;
  title?: string;
  start_time?: string;
  start?: string;
  end_time?: string;
  end?: string;
  all_day?: boolean;
  allDay?: boolean;
  google_calendar_id?: string;
  googleCalendarId?: string;
  linked_task_id?: string;
  linkedTaskId?: string;
  synced_at?: string;
  syncedAt?: string;
}

export async function updateEvent(eventId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: updated, error } = await supabase
    .from("calendar_events")
    .update(data)
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/calendar");
  return normalizeEvent(updated);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/calendar");
}

export async function syncCalendar(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated. Connect Google Calendar first.");
  }

  // One-way sync: pull events from Supabase (Google sync flow handled via OAuth)
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  return (events || []).map(normalizeEvent);
}

function normalizeEvent(raw: DatabaseEvent): CalendarEvent {
  return {
    id: raw.id?.toString() || "",
    title: raw.title || "",
    start: raw.start_time || raw.start || "",
    end: raw.end_time || raw.end || "",
    allDay: raw.all_day || raw.allDay || false,
    googleCalendarId: raw.google_calendar_id || raw.googleCalendarId || "",
    linkedTaskId: raw.linked_task_id || raw.linkedTaskId || undefined,
    syncedAt: raw.synced_at || raw.syncedAt || new Date().toISOString(),
  };
}
