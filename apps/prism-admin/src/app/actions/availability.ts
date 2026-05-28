"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const slotInputSchema = z.object({
  id: z.string().optional(),
  quarterLabel: z.string().min(1, "Quarter label is required"),
  totalSlots: z.number().int().min(0),
  filledSlots: z.number().int().min(0),
  isActive: z.boolean().default(false),
});

export type SlotInput = z.infer<typeof slotInputSchema>;

export async function getAvailabilitySlots() {
  try {
    const adminClient = getAdminClient();

    const { data, error } = await (
      adminClient.from("availability_slots")
    )
      .select("*")
      .order("quarter_label", { ascending: false });

    if (error) throw error;

    return { success: true, data: data ?? [] } as const;
  } catch (error) {
    console.error("[availability] getAvailabilitySlots error:", error);
    return {
      success: false,
      error: "Failed to fetch availability slots",
      data: [],
    } as const;
  }
}

export async function saveAvailabilitySlot(
  input: SlotInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = slotInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      };
    }

    if (parsed.data.filledSlots > parsed.data.totalSlots) {
      return {
        success: false,
        error: "Filled slots cannot exceed total slots",
      };
    }

    const adminClient = getAdminClient();
    const { id, ...row } = parsed.data;

    if (id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient.from("availability_slots") as any)
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminClient.from("availability_slots") as any)
        .insert({ ...row, updated_at: new Date().toISOString() });

      if (error) throw error;
    }

    revalidatePath("/admin/agency/availability");
    return { success: true };
  } catch (error) {
    console.error("[availability] saveAvailabilitySlot error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save availability slot",
    };
  }
}

export async function setActiveQuarter(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: resetError } = await (adminClient.from("availability_slots") as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq("id", id);

    if (resetError) throw resetError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient.from("availability_slots") as any)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/availability");
    return { success: true };
  } catch (error) {
    console.error("[availability] setActiveQuarter error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to set active quarter",
    };
  }
}

export async function deleteAvailabilitySlot(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();

    const { error } = await adminClient.from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/availability");
    return { success: true };
  } catch (error) {
    console.error("[availability] deleteAvailabilitySlot error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete availability slot",
    };
  }
}
