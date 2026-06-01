"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// =============================================================================
// TAG HELPERS (Phase 1B — junction tables)
// =============================================================================

/**
 * Upsert tag names into the `tags` table and sync the `release_tags` junction.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncReleaseTags(supabase: any, releaseId: string, tagNames: string[]) {
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    // Try to find existing tag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: tag } = await (supabase as any)
      .from("tags")
      .select("id")
      .eq("name", trimmed)
      .single();

    if (!tag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created } = await (supabase as any)
        .from("tags")
        .insert({ name: trimmed })
        .select("id")
        .single();
      if (created) tag = created;
    }

    if (tag) tagIds.push(tag.id);
  }

  // Delete existing junction rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("release_tags").delete().eq("release_id", releaseId);

  // Insert new junction rows
  if (tagIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("release_tags").insert(
      tagIds.map((tagId) => ({ release_id: releaseId, tag_id: tagId }))
    );
  }
}

/**
 * Extract tag names from the nested release_tags → tags join result.
 */
function extractTags(raw: Record<string, unknown>): string[] {
  const junction = raw.release_tags as
    | Array<{ tags: { name: string } | null }>
    | undefined;
  if (!junction) return [];
  return junction.map((row) => row.tags?.name).filter(Boolean) as string[];
}

// =============================================================================
// SCHEMA
// =============================================================================

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

interface ReleaseRow {
  id: string;
  title: string;
  version: string | null;
  date: string;
  type: string;
  description: string;
  link: string | null;
  tags: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const sb = () => getAdminClient();

// =============================================================================
// ACTIONS
// =============================================================================

export async function getReleases() {
  try {
    const { data, error } = await sb()
      .from("releases")
      .select("*, release_tags(tags(name))")
      .order("date", { ascending: false });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const releases = (data ?? []).map((r: Record<string, unknown>) => ({
      ...(r as Record<string, any>),
      tags: extractTags(r),
    }));
    return { success: true, data: releases as ReleaseRow[] };
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
      .select("*, release_tags(tags(name))")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return { success: true, data: null };
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = { ...(data as Record<string, any>), tags: extractTags(data) } as ReleaseRow;
    return { success: true as const, data: row };
  } catch (error) {
    console.error("[releases] getRelease error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch release",
      data: null as ReleaseRow | null,
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

    const { data: inserted, error } = await sb()
      .from("releases")
      .insert({
        title: parsed.data.title,
        version: parsed.data.version,
        date: parsed.data.date,
        type: parsed.data.type,
        description: parsed.data.description,
        link: parsed.data.link,
        is_featured: parsed.data.is_featured,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Sync tags via junction table
    if (parsed.data.tags && parsed.data.tags.length > 0 && inserted) {
      await syncReleaseTags(sb(), inserted.id, parsed.data.tags);
    }

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

    // Sync tags via junction table
    if (parsed.data.tags !== undefined) {
      await syncReleaseTags(sb(), id, parsed.data.tags ?? []);
    }

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
    // Delete junction rows first (CASCADE may handle this, but be explicit)
    await sb().from("release_tags").delete().eq("release_id", id);

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
