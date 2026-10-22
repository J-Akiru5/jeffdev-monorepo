import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { PrismPageClient } from "@/components/prism-page";

export const metadata: Metadata = {
  title: "Prism Context Engine",
  description:
    "Prism is a context governance platform for AI coding assistants. Deploy rules, design systems, and security constraints to your AI tools.",
  alternates: { canonical: "/prism" },
  openGraph: {
    title: "Prism Context Engine — Something is forming",
    description:
      "A context governance platform for AI coding assistants. Join the waitlist for early access.",
    url: "/prism",
    type: "website",
  },
  twitter: {
    title: "Prism Context Engine — Something is forming",
    description:
      "A context governance platform for AI coding assistants. Join the waitlist for early access.",
  },
};

export const revalidate = 60;

export default async function PrismPage() {
  const cms = await getPageContent("prism");

  return <PrismPageClient pageContent={cms || undefined} />;
}
