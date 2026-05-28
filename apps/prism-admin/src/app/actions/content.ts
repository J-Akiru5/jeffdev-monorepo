"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const statSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const founderSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  image: z.string(),
  email: z.string(),
  location: z.string(),
  availability: z.string(),
});

const techStackSchema = z.record(z.string(), z.array(z.string()));

const valueSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const brandAssetsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string(),
  downloadUrl: z.string(),
});

const heroSchema = z.object({
  tagline: z.string().min(1),
  heading1: z.string().min(1),
  heading2: z.string().min(1),
  description: z.string().min(1),
  subDescription: z.string(),
});

const aboutContentSchema = z.object({
  hero: heroSchema,
  stats: z.array(statSchema).min(1),
  founder: founderSchema,
  techStack: techStackSchema,
  values: z.array(valueSchema).min(1),
  brandAssets: brandAssetsSchema,
});

export type AboutContent = z.infer<typeof aboutContentSchema>;

export async function saveAboutContent(
  content: AboutContent,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = aboutContentSchema.safeParse(content);
    if (!parsed.success) {
      return {
        success: false,
        error: `Validation failed: ${parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
      };
    }

    const adminClient = getAdminClient();

    const { error } = await adminClient.from("site_pages").upsert(
      {
        slug: "about",
        content: parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );

    if (error) throw error;

    revalidatePath("/admin/agency/content");

    return { success: true };
  } catch (error) {
    console.error("[content] saveAboutContent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save content",
    };
  }
}

export async function getAboutContent(): Promise<AboutContent | null> {
  try {
    const adminClient = getAdminClient();

    const { data, error } = await adminClient
      .from("site_pages")
      .select("content")
      .eq("slug", "about")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return (data?.content ?? null) as AboutContent | null;
  } catch (error) {
    console.error("[content] getAboutContent error:", error);
    return null;
  }
}
