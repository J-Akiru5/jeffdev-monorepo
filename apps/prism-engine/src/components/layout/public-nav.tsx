"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { BetaBadge } from "@/components/beta-badge";
import { SyntaxureLogo, useAuth } from "@syntaxure/ui";

export function PublicNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-heavy fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <SyntaxureLogo className="h-8 w-8 transition-transform group-hover:scale-110" />
            <span className="text-gradient-cyan font-bold text-lg">
              Prism Context Engine
            </span>
            <BetaBadge />
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="https://docs.syntaxure.dev"
              target="_blank"
              className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className={clsx(
                "transition-colors text-sm font-mono uppercase tracking-wider",
                isActive("/pricing")
                  ? "text-blue-600 dark:text-cyan-400"
                  : "text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400",
              )}
            >
              Pricing
            </Link>
            <Link
              href="https://www.syntaxure.dev"
              target="_blank"
              className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider"
            >
              Agency
            </Link>
            {loading ? (
              <div className="flex gap-4 items-center">
                <div className="w-16 h-4 bg-[var(--border-subtle)] animate-pulse rounded-md" />
                <div className="w-24 h-9 bg-[var(--border-subtle)] animate-pulse rounded-md" />
              </div>
            ) : user ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 dark:glass !text-white dark:!text-[var(--text-primary)] px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider shadow-[0_2px_8px_rgba(37,99,235,0.3)] dark:shadow-none"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-[var(--text-primary)] transition-colors text-sm font-mono uppercase tracking-wider"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 dark:glass !text-white dark:!text-[var(--text-primary)] px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider shadow-[0_2px_8px_rgba(37,99,235,0.3)] dark:shadow-none"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
