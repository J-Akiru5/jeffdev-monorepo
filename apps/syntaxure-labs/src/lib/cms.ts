import { createClient } from "@/lib/supabase/server";

/**
 * CMS Bridge Layer
 * -----------------
 * Reads page content from site_pages JSONB.
 * When Phase 1D lands (page_sections table), swap this one function.
 *
 * Pattern follows About page (src/app/about/page.tsx:83-115)
 * but generalized for any slug.
 */

export async function getPageContent(
  slug: string,
): Promise<Record<string, any> | undefined> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_pages")
      .select("content")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data?.content) return undefined;
    const content = data.content;
    if (typeof content === "object" && content !== null) {
      return content as Record<string, any>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
