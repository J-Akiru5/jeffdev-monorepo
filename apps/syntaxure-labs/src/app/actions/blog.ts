/**
 * Blog Server Actions (Public)
 * -----------------------------
 * Read-only actions for the public blog.
 * Admin CRUD is in prism-admin.
 */

"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { logDataError } from "@/lib/errors";
import type { BlogPost } from "@/types/blog";

export async function getBlogPosts(limit = 20): Promise<BlogPost[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as BlogPost[];
  } catch (error) {
    logDataError("[GET BLOG POSTS ERROR]", error);
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) throw error;
    return data as BlogPost;
  } catch (error) {
    logDataError("[GET BLOG POST ERROR]", error);
    return null;
  }
}

export async function getBlogTags(): Promise<string[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("tags")
      .eq("status", "published");

    if (error) throw error;

    const tags = new Set<string>();
    for (const post of data || []) {
      for (const tag of post.tags || []) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  } catch (error) {
    logDataError("[GET BLOG TAGS ERROR]", error);
    return [];
  }
}
