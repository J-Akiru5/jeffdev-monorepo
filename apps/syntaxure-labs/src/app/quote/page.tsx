import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { QUOTE_DEFAULTS } from "@/data/cms-defaults";
import { QuotePageClient } from "@/components/quote-page";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Request a project quote from Syntaxure Labs. Fixed pricing, transparent process.",
};

export const revalidate = 60;

export default async function QuotePage() {
  const cms = await getPageContent("quote");

  return (
    <QuotePageClient
      pageContent={cms || undefined}
      defaults={QUOTE_DEFAULTS}
    />
  );
}
