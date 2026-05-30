"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface CommunityMember {
  id: string;
  email: string;
  full_name: string;
  github_username: string | null;
  discord_handle: string | null;
  primary_role: string | null;
  interests: string | null;
  created_at: string;
  updated_at: string;
}

const sb = () => getAdminClient();

export async function getCommunityMembers() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: (data ?? []) as CommunityMember[] };
  } catch (error) {
    console.error("[community] getCommunityMembers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community members",
      data: [],
    };
  }
}

export async function deleteCommunityMember(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb() as any)
      .from("community_members")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true };
  } catch (error) {
    console.error("[community] deleteCommunityMember error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete community member",
    };
  }
}
