"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const releaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  version: z.string().nullable(),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["tool", "update", "patch"]),
  description: z.string().min(1, "Description is required"),
  link: z.string().nullable(),
  tags: z.array(z.string()).nullable().optional(),
  is_featured: z.boolean().default(false),
});

export type ReleaseFormData = z.infer<typeof releaseSchema>;

const sb = () => getAdminClient();

export async function getReleases() {
  try {
    const { data, error } = await sb()
      .from("releases")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error("[releases] getReleases error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch releases",
      data: [],
    };
  }
}

export async function getRelease(id: string) {
  try {
    const { data, error } = await sb()
      .from("releases")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return { success: true, data: null };
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error("[releases] getRelease error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch release",
      data: null,
    };
  }
}

export async function createRelease(
  formData: ReleaseFormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = releaseSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: `Validation failed: ${parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
      };
    }

    const { error } = await sb()
      .from("releases")
      .insert({
        title: parsed.data.title,
        version: parsed.data.version,
        date: parsed.data.date,
        type: parsed.data.type,
        description: parsed.data.description,
        link: parsed.data.link,
        is_featured: parsed.data.is_featured,
      });

    if (error) throw error;

    revalidatePath("/admin/agency/releases");
    return { success: true };
  } catch (error) {
    console.error("[releases] createRelease error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create release",
    };
  }
}

export async function updateRelease(
  id: string,
  formData: ReleaseFormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = releaseSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: `Validation failed: ${parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
      };
    }

    const { error } = await sb()
      .from("releases")
      .update({
        title: parsed.data.title,
        version: parsed.data.version,
        date: parsed.data.date,
        type: parsed.data.type,
        description: parsed.data.description,
        link: parsed.data.link,
        is_featured: parsed.data.is_featured,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/releases");
    return { success: true };
  } catch (error) {
    console.error("[releases] updateRelease error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update release",
    };
  }
}

export async function deleteRelease(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await sb().from("releases").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/releases");
    return { success: true };
  } catch (error) {
    console.error("[releases] deleteRelease error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete release",
    };
  }
}
