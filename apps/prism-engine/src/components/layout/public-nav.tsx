"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Menu, X, ArrowRight } from "lucide-react";
import { BetaBadge } from "@/components/beta-badge";
import { SyntaxureLogo, useAuth } from "@syntaxure/ui";

export function PublicNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 font-mono text-sm font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
              >
                <span className="relative z-10 uppercase">Dashboard</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 font-mono text-sm font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
                >
                  <span className="relative z-10 uppercase">Start Free</span>
                  <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-heavy border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
            <Link
              href="https://docs.syntaxure.dev"
              target="_blank"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider py-2"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "transition-colors text-sm font-mono uppercase tracking-wider py-2",
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
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider py-2"
            >
              Agency
            </Link>
            <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-3">
              {loading ? (
                <div className="w-24 h-9 bg-[var(--border-subtle)] animate-pulse rounded-md" />
              ) : user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 font-mono text-sm font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
                >
                  <span className="relative z-10 uppercase">Dashboard</span>
                  <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-[var(--text-primary)] transition-colors text-sm font-mono uppercase tracking-wider text-center py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 font-mono text-sm font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 mt-2"
                  >
                    <span className="relative z-10 uppercase">Start Free</span>
                    <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
