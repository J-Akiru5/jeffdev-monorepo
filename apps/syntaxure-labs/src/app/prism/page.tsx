import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { PrismPageClient } from "@/components/prism-page";

export const metadata: Metadata = {
  title: "Prism Context Engine",
  description:
    "Prism — deploy a context server that forces AI coding tools to follow your rules.",
};

export const revalidate = 60;

export default async function PrismPage() {
  const cms = await getPageContent("prism");

  return <PrismPageClient pageContent={cms || undefined} />;
}
