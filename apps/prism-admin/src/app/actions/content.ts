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

const missionVisionSchema = z.object({
  executiveSummary: z.string().min(1),
  mission: z.string().min(1),
  vision: z.string().min(1),
});

const kwadraTbiSchema = z.object({
  heading: z.string().min(1),
  description: z.string().min(1),
  badges: z.array(z.string()).min(1),
});

const founderEntrySchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  image: z.string(),
  email: z.string(),
  location: z.string(),
});

const teamMemberSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  image: z.string(),
});

const sectionHeadersSchema = z.object({
  founder: z.object({ cardLabel: z.string() }),
  kwadraTbi: z.object({ label: z.string() }),
  missionVision: z.object({
    label: z.string(),
    missionLabel: z.string(),
    visionLabel: z.string(),
  }),
  founders: z.object({ label: z.string(), subtitle: z.string() }),
  techStack: z.object({ label: z.string(), subtitle: z.string() }),
  team: z.object({ label: z.string(), subtitle: z.string() }),
  values: z.object({ heading: z.string() }),
  brandAssets: z.object({ heading: z.string() }),
});

const aboutContentSchema = z.object({
  hero: heroSchema,
  stats: z.array(statSchema).min(1),
  founder: founderSchema,
  missionVision: missionVisionSchema,
  kwadraTbi: kwadraTbiSchema,
  founders: z.array(founderEntrySchema).min(1),
  team: z.array(teamMemberSchema),
  techStack: techStackSchema,
  values: z.array(valueSchema).min(1),
  brandAssets: brandAssetsSchema,
  sectionHeaders: sectionHeadersSchema,
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

    // Phase 1D: Write structured sections instead of monolithic JSONB.
    // Each top-level key in the about content becomes a page_section row.
    const slug = "about";
    const now = new Date().toISOString();
    const sections = Object.entries(parsed.data) as [string, unknown][];

    for (let i = 0; i < sections.length; i++) {
      const [key, value] = sections[i]!;
      const { error } = await adminClient.from("page_sections").upsert(
        {
          page_slug: slug,
          section_key: key,
          section_type: Array.isArray(value) ? "list" : typeof value === "object" ? "content" : "text",
          content: value,
          sort_order: i,
          updated_at: now,
        },
        { onConflict: "page_slug,section_key" },
      );
      if (error) throw error;
    }

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

// ─── Generic Page Content Helpers ──────────────────────────────────────────────

export async function getPageContent(
  slug: string,
): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
  try {
    const adminClient = getAdminClient();
    // Phase 1D: Read from page_sections instead of site_pages.content
    const { data: rows, error } = await adminClient
      .from("page_sections")
      .select("section_key, content")
      .eq("page_slug", slug)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!rows || rows.length === 0) return { success: true, data: {} };

    const data: Record<string, any> = {};
    for (const row of rows) {
      data[row.section_key] = row.content;
    }
    return { success: true, data };
  } catch (error) {
    console.error("[content] getPageContent error:", error);
    return { success: false, error: "Failed to load page content" };
  }
}

export async function savePageContent(
  slug: string,
  content: Record<string, any>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const now = new Date().toISOString();
    // Phase 1D: Write to page_sections instead of site_pages.content
    const entries = Object.entries(content) as [string, any][];

    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]!;
      const { error } = await adminClient.from("page_sections").upsert(
        {
          page_slug: slug,
          section_key: key,
          section_type: Array.isArray(value) ? "list" : typeof value === "object" ? "content" : "text",
          content: value,
          sort_order: i,
          updated_at: now,
        },
        { onConflict: "page_slug,section_key" },
      );
      if (error) throw error;
    }

    revalidatePath("/admin/agency/content");
    revalidatePath(`/admin/agency/content/${slug}`);
    return { success: true };
  } catch (error) {
    console.error("[content] savePageContent error:", error);
    return { success: false, error: "Failed to save page content" };
  }
}

export async function getAboutContent(): Promise<AboutContent | null> {
  try {
    const adminClient = getAdminClient();

    // Phase 1D: Reassemble about content from page_sections rows.
    const { data: rows, error } = await adminClient
      .from("page_sections")
      .select("section_key, content")
      .eq("page_slug", "about")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!rows || rows.length === 0) return null;

    const content: Record<string, unknown> = {};
    for (const row of rows) {
      content[row.section_key] = row.content;
    }
    return content as AboutContent;
  } catch (error) {
    console.error("[content] getAboutContent error:", error);
    return null;
  }
}
