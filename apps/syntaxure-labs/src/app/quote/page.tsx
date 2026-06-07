import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { QUOTE_DEFAULTS } from "@/data/cms-defaults";
import { QuotePageClient } from "@/components/quote-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Request a project quote from Syntaxure Labs. Fixed pricing, transparent process.",
};

export const revalidate = 60;

export default async function QuotePage() {
  const supabase = await createClient();
  const cms = await getPageContent("quote");

  // Fetch active product templates for the selection step
  let templates: unknown[] = [];
  try {
    const { data } = await supabase
      .from("product_templates")
      .select("id, name, slug, tagline, short_description, icon, base_price_monthly_php, base_price_monthly_usd, features, tech_stack")
      .eq("status", "active")
      .order("sort_order", { ascending: true });
    templates = data || [];
  } catch (error) {
    console.error("[QUOTE PAGE] Failed to fetch templates:", error);
  }

  return (
    <QuotePageClient
      templates={(templates as import("@/components/quote-page").ProductTemplate[]) || []}
      pageContent={cms || undefined}
      defaults={QUOTE_DEFAULTS}
    />
  );
}
