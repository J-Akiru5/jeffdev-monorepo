"use client";

/**
 * PortfolioTabs
 * -------------
 * Plain link tabs shared by the Portfolio list and the partners register.
 * Active state is derived from the pathname (no router-tabs dependency).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Handshake } from "lucide-react";

const TABS = [
  { href: "/portfolio", label: "Projects", icon: BriefcaseBusiness },
  { href: "/portfolio/partners", label: "Partners", icon: Handshake },
] as const;

export function PortfolioTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Portfolio sections"
      className="inline-flex gap-1 rounded-lg border border-border bg-glass-04 p-1"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active =
          tab.href === "/portfolio"
            ? pathname === "/portfolio" ||
              (pathname.startsWith("/portfolio/") &&
                !pathname.startsWith("/portfolio/partners"))
            : pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
