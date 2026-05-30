import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prism Context Engine | AI-Powered Context Governance",
  description:
    "Prism is a context governance platform for AI coding assistants. Deploy architectural rules, design systems, and security constraints to Cursor, Claude, Windsurf, and VS Code via MCP.",
  openGraph: {
    title: "Prism Context Engine | AI-Powered Context Governance",
    description:
      "Deploy architectural rules and design systems to AI coding assistants via MCP.",
    url: "https://prism.syntaxure.dev",
    siteName: "Syntaxure Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism Context Engine",
    description:
      "AI-powered context governance for coding assistants.",
  },
  alternates: {
    canonical: "https://prism.syntaxure.dev/prism",
  },
};

export default function PrismLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
