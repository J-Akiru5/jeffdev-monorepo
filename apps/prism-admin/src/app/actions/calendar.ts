"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  event_type: z.enum(["meeting", "deadline", "review", "delivery", "other"]),
});

export type EventInput = z.infer<typeof eventSchema>;

export async function createEvent(
  input: EventInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient.from("calendar_events").insert({
      title: parsed.data.title,
      description: parsed.data.description,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      event_type: parsed.data.event_type,
    });

    if (error) throw error;

    revalidatePath("/admin/agency/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.start_time !== undefined) updates.start_time = input.start_time;
    if (input.end_time !== undefined) updates.end_time = input.end_time;
    if (input.event_type !== undefined) updates.event_type = input.event_type;

    const { error } = await adminClient.from("calendar_events").update(updates).eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event",
    };
  }
}

export async function deleteEvent(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient.from("calendar_events").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}
