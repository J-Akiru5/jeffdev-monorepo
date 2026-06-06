import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const appPages = [
  { slug: "prism-engine", label: "prism-engine" },
  { slug: "prism-mcp-server", label: "prism-mcp-server" },
  { slug: "prism-context-engine", label: "prism-context-engine" },
  { slug: "prism-docs", label: "prism-docs" },
  { slug: "prism-admin", label: "prism-admin" },
  { slug: "prism-manage", label: "prism-manage" },
  { slug: "syntaxure-labs", label: "syntaxure-labs" },
  { slug: "prism-analytics", label: "prism-analytics" },
];

export default function AppDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-8">
      <aside className="hidden w-48 shrink-0 lg:block">
        <Link
          href="/docs/apps"
          className="mb-4 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Apps
        </Link>
        <nav className="space-y-0.5">
          {appPages.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/apps/${page.slug}`}
              className="block rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
            >
              {page.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
