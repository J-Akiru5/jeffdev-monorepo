"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SavedView {
  id: string;
  name: string;
  config: Record<string, unknown>;
  isShared: boolean;
  createdAt: string;
}

function mapView(v: Record<string, unknown>): SavedView {
  return {
    id: String(v.id),
    name: String(v.name || ""),
    config: (v.config as Record<string, unknown>) || {},
    isShared: v.is_shared === true,
    createdAt: String(v.created_at),
  };
}

export async function getSavedViews(workspaceId: string): Promise<SavedView[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("saved_views")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    return (data || []).map(mapView);
  } catch {
    return [];
  }
}

export async function createSavedView(input: {
  workspaceId: string;
  name: string;
  config: Record<string, unknown>;
}): Promise<{ success?: boolean; error?: string; view?: SavedView }> {
  const name = input.name.trim();
  if (!name || name.length > 60) {
    return { error: "View name must be 1-60 characters" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("saved_views")
    .insert({
      user_id: user.id,
      workspace_id: input.workspaceId,
      name,
      config: input.config,
    })
    .select("*")
    .single();

  if (error || !data) return { error: error?.message || "Failed to save view" };

  revalidatePath("/tasks");
  return { success: true, view: mapView(data) };
}

export async function deleteSavedView(id: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: deleted, error } = await supabase
    .from("saved_views")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!deleted || deleted.length === 0) return { error: "View not found" };

  revalidatePath("/tasks");
  return { success: true };
}
