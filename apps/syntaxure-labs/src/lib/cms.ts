import { createClient } from "@/lib/supabase/server";
import { logDataError } from "@/lib/errors";

/**
 * CMS Bridge Layer
 * -----------------
 * Reads page content from page_sections table (Phase 1D).
 * Each section_key becomes a top-level key in the returned object.
 */

export async function getPageContent(
  slug: string,
): Promise<Record<string, any> | undefined> {
  try {
    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("page_sections")
      .select("section_key, content")
      .eq("page_slug", slug)
      .order("sort_order", { ascending: true });

    if (error) {
      logDataError("[GET PAGE CONTENT ERROR]", error);
      return undefined;
    }
    if (!rows || rows.length === 0) return undefined;

    const content: Record<string, any> = {};
    for (const row of rows) {
      content[row.section_key] = row.content;
    }
    return content;
  } catch (error) {
    logDataError("[GET PAGE CONTENT ERROR]", error);
    return undefined;
  }
}
