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
  location: z.string().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
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

    const { logAuditEvent } = await import("@/lib/audit");
    const adminClient = getAdminClient();

    const { data, error } = await adminClient
      .from("calendar_events")
      .insert({
        user_id: (await adminClient.auth.getUser()).data.user?.id || "",
        title: parsed.data.title,
        description: parsed.data.description,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        event_type: parsed.data.event_type,
        location: parsed.data.location || null,
        project_id: parsed.data.project_id || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "calendar_events",
      resourceId: data.id,
      details: { title: parsed.data.title, event_type: parsed.data.event_type },
    });

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
    const { logAuditEvent } = await import("@/lib/audit");
    const adminClient = getAdminClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.start_time !== undefined) updates.start_time = input.start_time;
    if (input.end_time !== undefined) updates.end_time = input.end_time;
    if (input.event_type !== undefined) updates.event_type = input.event_type;
    if (input.location !== undefined) updates.location = input.location;
    if (input.project_id !== undefined) updates.project_id = input.project_id;

    const { error } = await adminClient
      .from("calendar_events")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "calendar_events",
      resourceId: id,
      details: { changes: Object.keys(updates) },
    });

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
    const { logAuditEvent } = await import("@/lib/audit");
    const adminClient = getAdminClient();

    // Fetch event before deletion for audit
    const { data: event } = await adminClient
      .from("calendar_events")
      .select("title")
      .eq("id", id)
      .single();

    const { error } = await adminClient
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "calendar_events",
      resourceId: id,
      details: { title: event?.title },
    });

    revalidatePath("/admin/agency/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}
