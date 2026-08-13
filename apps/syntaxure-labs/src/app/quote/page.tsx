import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { QUOTE_DEFAULTS } from "@/data/cms-defaults";
import { QuotePageClient } from "@/components/quote-page";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Request a project quote from Syntaxure Labs. Custom websites, SaaS platforms, AI integration, and cloud infrastructure.",
};

export const revalidate = 60;

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  // Read preselected service from URL (e.g. /quote?service=web-development)
  const preselectedService =
    typeof params.service === "string" ? params.service : null;

  const cms = await getPageContent("quote");

  return (
    <QuotePageClient
      preselectedService={preselectedService}
      pageContent={cms || undefined}
      defaults={QUOTE_DEFAULTS}
    />
  );
}
