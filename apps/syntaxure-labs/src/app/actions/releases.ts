"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";

const TABLE = "releases" as const;

interface ReleaseData {
  id?: string;
  title: string;
  version?: string | null;
  date: string;
  type: "tool" | "update" | "patch";
  description: string;
  link?: string | null;
  tags?: string[] | null;
  is_featured: boolean;
}

export async function getReleases(): Promise<ReleaseData[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("date", { ascending: false });

    if (error || !data) return [];
    return data as ReleaseData[];
  } catch (error) {
    console.error("[GET RELEASES ERROR]", error);
    return [];
  }
}

export async function getReleaseById(id: string): Promise<ReleaseData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as ReleaseData;
  } catch (error) {
    console.error("[GET RELEASE ERROR]", error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRelease(data: any) {
  return {
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function createRelease(
  data: Omit<ReleaseData, "id" | "created_at" | "updated_at">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { data: result, error } = await supabase
      .from(TABLE)
      .insert(makeRelease(data))
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "releases",
      resourceId: result.id,
      details: { title: data.title },
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error("[CREATE RELEASE ERROR]", error);
    return { success: false, error: "Failed to create release" };
  }
}

export async function updateRelease(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { error } = await supabase
      .from(TABLE)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "releases",
      resourceId: id,
    });

    return { success: true };
  } catch (error) {
    console.error("[UPDATE RELEASE ERROR]", error);
    return { success: false, error: "Failed to update release" };
  }
}

export async function deleteRelease(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from(TABLE as string).delete().eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "releases",
      resourceId: id,
    });

    return { success: true };
  } catch (error) {
    console.error("[DELETE RELEASE ERROR]", error);
    return { success: false, error: "Failed to delete release" };
  }
}
