"use server";

/**
 * Agency Blog Server Actions
 * ---------------------------
 * CRUD operations for blog posts.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(500).optional().default(""),
  content: z.string().min(1).max(50000),
  cover_image: z.string().url().optional().default(""),
  author: z.string().min(1).max(100).default("Syntaxure Labs"),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string()).default([]),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getAgencyBlogPosts(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[GET AGENCY BLOG POSTS ERROR]", error);
    return { success: false, error: "Failed to fetch blog posts" };
  }
}

export async function getAgencyBlogPost(id: string): Promise<unknown | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error("[GET AGENCY BLOG POST ERROR]", error);
    return null;
  }
}

export async function createAgencyBlogPost(data: BlogPostFormData): Promise<ActionResult> {
  try {
    const validated = blogPostSchema.parse(data);
    const supabase = getAdminClient();

    const { error } = await (supabase as any).from("blog_posts").insert({
      ...validated,
      published_at: validated.status === "published" ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "blog_posts",
      resourceId: validated.slug,
      details: { title: validated.title, status: validated.status },
    });

    revalidatePath("/admin/agency/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("[CREATE AGENCY BLOG POST ERROR]", error);
    return { success: false, error: "Failed to create blog post" };
  }
}

export async function updateAgencyBlogPost(id: string, data: Partial<BlogPostFormData>): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.excerpt !== undefined) updatePayload.excerpt = data.excerpt;
    if (data.content !== undefined) updatePayload.content = data.content;
    if (data.cover_image !== undefined) updatePayload.cover_image = data.cover_image;
    if (data.author !== undefined) updatePayload.author = data.author;
    if (data.tags !== undefined) updatePayload.tags = data.tags;

    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === "published") {
        updatePayload.published_at = new Date().toISOString();
      }
    }

    const { error } = await (supabase as any).from("blog_posts").update(updatePayload).eq("id", id);
    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "blog_posts",
      resourceId: id,
      details: data,
    });

    revalidatePath("/admin/agency/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE AGENCY BLOG POST ERROR]", error);
    return { success: false, error: "Failed to update blog post" };
  }
}

export async function deleteAgencyBlogPost(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "blog_posts",
      resourceId: id,
    });

    revalidatePath("/admin/agency/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("[DELETE AGENCY BLOG POST ERROR]", error);
    return { success: false, error: "Failed to delete blog post" };
  }
}
