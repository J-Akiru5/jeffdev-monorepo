"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

export const PageSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  title: z.string(),
  content: z.array(z.record(z.string(), z.unknown())).default([]),
  icon: z.string().default("📄"),
  icon_color: z.string().default("#6366f1"),
  cover_url: z.string().nullable(),
  sort_order: z.number().int().default(0),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Page = z.infer<typeof PageSchema>;

export const CreatePageSchema = z.object({
  workspace_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).default("Untitled"),
  icon: z.string().optional(),
});

export const UpdatePageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.array(z.record(z.string(), z.unknown())).optional(),
  icon: z.string().optional(),
  icon_color: z.string().optional(),
  cover_url: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

// =============================================================================
// SERVER ACTIONS
// =============================================================================

/**
 * Get all pages for a workspace, organized as a flat list.
 * The client builds the tree structure.
 */
export async function getPages(workspaceId: string): Promise<Page[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch pages:", error.message);
    return [];
  }

  return (data || []) as Page[];
}

/**
 * Get a single page by ID.
 */
export async function getPage(pageId: string): Promise<Page | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error) {
    console.error("Failed to fetch page:", error.message);
    return null;
  }

  return data as Page;
}

/**
 * Create a new page.
 */
export async function createPage(input: {
  workspace_id: string;
  parent_id?: string | null;
  title?: string;
  icon?: string;
}): Promise<{ success: boolean; page?: Page; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = CreatePageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Invalid input" };
  }

  // Get max sort_order for siblings
  const { data: siblings } = await supabase
    .from("pages")
    .select("sort_order")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("parent_id", parsed.data.parent_id || null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (siblings?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("pages")
    .insert({
      workspace_id: parsed.data.workspace_id,
      parent_id: parsed.data.parent_id || null,
      title: parsed.data.title || "Untitled",
      icon: parsed.data.icon || "📄",
      content: [],
      sort_order: nextOrder,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create page:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, page: data as Page };
}

/**
 * Update a page (title, content, icon, etc.).
 */
export async function updatePage(
  pageId: string,
  updates: z.infer<typeof UpdatePageSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = UpdatePageSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("pages")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", pageId);

  if (error) {
    console.error("Failed to update page:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * Delete a page and all its children.
 */
export async function deletePage(
  pageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId);

  if (error) {
    console.error("Failed to delete page:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * Reorder pages within a parent.
 */
export async function reorderPages(
  pageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Update sort_order for each page
  const updates = pageIds.map((id, index) =>
    supabase
      .from("pages")
      .update({ sort_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);

  if (firstError?.error) {
    console.error("Failed to reorder pages:", firstError.error.message);
    return { success: false, error: firstError.error.message };
  }

  revalidatePath("/");
  return { success: true };
}
