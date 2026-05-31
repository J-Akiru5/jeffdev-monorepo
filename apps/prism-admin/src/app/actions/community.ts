"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes } from "crypto";

// =============================================================================
// INTERFACES
// =============================================================================

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

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  category: "discussion" | "showcase" | "question";
  tags: string[];
  author_id: string | null;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: CommunityMember | null;
}

export interface CommunityInvite {
  id: string;
  email: string;
  name: string;
  token: string;
  accepted: boolean;
  created_at: string;
  expires_at: string;
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  image_url: z.string().nullable().optional(),
  category: z.enum(["discussion", "showcase", "question"]),
  tags: z.array(z.string()).default([]),
  author_id: z.string().uuid().nullable().optional(),
  is_pinned: z.boolean().default(false),
  is_published: z.boolean().default(true),
});

export type CommunityPostInput = z.infer<typeof postSchema>;

const memberSchema = z.object({
  email: z.string().email("Valid email is required"),
  full_name: z.string().min(1, "Full name is required"),
  github_username: z.string().nullable().optional(),
  discord_handle: z.string().nullable().optional(),
  primary_role: z.string().nullable().optional(),
  interests: z.string().nullable().optional(),
});

export type CommunityMemberInput = z.infer<typeof memberSchema>;

// =============================================================================
// HELPERS
// =============================================================================

const sb = () => getAdminClient();

// =============================================================================
// MEMBER ACTIONS
// =============================================================================

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

export async function getCommunityMember(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_members")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return { success: true, data: null };
      throw error;
    }
    return { success: true, data: data as CommunityMember };
  } catch (error) {
    console.error("[community] getCommunityMember error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community member",
      data: null,
    };
  }
}

export async function createCommunityMember(
  input: CommunityMemberInput
): Promise<{ success: boolean; data?: CommunityMember; error?: string }> {
  try {
    const parsed = memberSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_members")
      .insert({
        email: parsed.data.email,
        full_name: parsed.data.full_name,
        github_username: parsed.data.github_username || null,
        discord_handle: parsed.data.discord_handle || null,
        primary_role: parsed.data.primary_role || null,
        interests: parsed.data.interests || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true, data: data as CommunityMember };
  } catch (error) {
    console.error("[community] createCommunityMember error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create community member",
    };
  }
}

export async function updateCommunityMember(
  id: string,
  input: Partial<CommunityMemberInput>
): Promise<{ success: boolean; data?: CommunityMember; error?: string }> {
  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.email !== undefined) updates.email = input.email;
    if (input.full_name !== undefined) updates.full_name = input.full_name;
    if (input.github_username !== undefined) updates.github_username = input.github_username || null;
    if (input.discord_handle !== undefined) updates.discord_handle = input.discord_handle || null;
    if (input.primary_role !== undefined) updates.primary_role = input.primary_role || null;
    if (input.interests !== undefined) updates.interests = input.interests || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true, data: data as CommunityMember };
  } catch (error) {
    console.error("[community] updateCommunityMember error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update community member",
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

// =============================================================================
// POST ACTIONS
// =============================================================================

export async function getCommunityPosts(filters?: {
  category?: string;
  search?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb() as any)
      .from("community_posts")
      .select("*, author:community_members(*)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: (data ?? []) as CommunityPost[] };
  } catch (error) {
    console.error("[community] getCommunityPosts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community posts",
      data: [],
    };
  }
}

export async function getCommunityPost(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_posts")
      .select("*, author:community_members(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return { success: true, data: null };
      throw error;
    }
    return { success: true, data: data as CommunityPost };
  } catch (error) {
    console.error("[community] getCommunityPost error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community post",
      data: null,
    };
  }
}

export async function createCommunityPost(
  input: CommunityPostInput
): Promise<{ success: boolean; data?: CommunityPost; error?: string }> {
  try {
    const parsed = postSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_posts")
      .insert({
        title: parsed.data.title,
        body: parsed.data.body,
        image_url: parsed.data.image_url || null,
        category: parsed.data.category,
        tags: parsed.data.tags,
        author_id: parsed.data.author_id || null,
        is_pinned: parsed.data.is_pinned,
        is_published: parsed.data.is_published,
      })
      .select("*, author:community_members(*)")
      .single();

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true, data: data as CommunityPost };
  } catch (error) {
    console.error("[community] createCommunityPost error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create community post",
    };
  }
}

export async function updateCommunityPost(
  id: string,
  input: Partial<CommunityPostInput>
): Promise<{ success: boolean; data?: CommunityPost; error?: string }> {
  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updates.title = input.title;
    if (input.body !== undefined) updates.body = input.body;
    if (input.image_url !== undefined) updates.image_url = input.image_url || null;
    if (input.category !== undefined) updates.category = input.category;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.author_id !== undefined) updates.author_id = input.author_id || null;
    if (input.is_pinned !== undefined) updates.is_pinned = input.is_pinned;
    if (input.is_published !== undefined) updates.is_published = input.is_published;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_posts")
      .update(updates)
      .eq("id", id)
      .select("*, author:community_members(*)")
      .single();

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true, data: data as CommunityPost };
  } catch (error) {
    console.error("[community] updateCommunityPost error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update community post",
    };
  }
}

export async function deleteCommunityPost(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb() as any)
      .from("community_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true };
  } catch (error) {
    console.error("[community] deleteCommunityPost error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete community post",
    };
  }
}

export async function togglePostPinned(id: string, isPinned: boolean) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb() as any)
      .from("community_posts")
      .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true };
  } catch (error) {
    console.error("[community] togglePostPinned error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update pin status",
    };
  }
}

export async function togglePostPublished(id: string, isPublished: boolean) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb() as any)
      .from("community_posts")
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true };
  } catch (error) {
    console.error("[community] togglePostPublished error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update publish status",
    };
  }
}

// =============================================================================
// INVITE ACTIONS
// =============================================================================

export async function inviteCommunityMember(
  email: string,
  name: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    if (!email || !name) {
      return { success: false, error: "Email and name are required" };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb() as any)
      .from("community_invites")
      .insert({
        email,
        name,
        token,
        expires_at: expiresAt,
      });

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true, token };
  } catch (error) {
    console.error("[community] inviteCommunityMember error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create invite",
    };
  }
}

export async function getCommunityInvites() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb() as any)
      .from("community_invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: (data ?? []) as CommunityInvite[] };
  } catch (error) {
    console.error("[community] getCommunityInvites error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch invites",
      data: [],
    };
  }
}

export async function deleteCommunityInvite(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb() as any)
      .from("community_invites")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/community");
    return { success: true };
  } catch (error) {
    console.error("[community] deleteCommunityInvite error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete invite",
    };
  }
}
