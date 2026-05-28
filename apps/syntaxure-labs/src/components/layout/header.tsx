"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@syntaxure/ui";
import { SyntaxureLogo } from "@syntaxure/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavLink {
  href: string;
  label: string;
  highlight?: boolean;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: NavLink[] = [
    {
      href: "/prism",
      label: "Prism Context Engine",
      highlight: true,
    },
    { href: "/services", label: "Services" },
    { href: "/work", label: "Work" },
    { href: "/community", label: "Community" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-glass-heavy backdrop-blur-xl border-b border-white/10 shadow-sm"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <SyntaxureLogo className="h-8 w-8" />
            <span className="hidden font-semibold tracking-tight text-white sm:block">
              Syntaxure Labs
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm transition-colors",
                  link.highlight
                    ? "flex items-center gap-1.5 text-purple-400 hover:text-purple-300"
                    : "text-white/60 hover:text-white",
                )}
              >
                {link.highlight && <Sparkles className="h-3.5 w-3.5" />}
                {link.label}
                {link.highlight && (
                  <span className="ml-1 rounded-full border border-purple-400/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-400">
                    Waitlist
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/quote"
              className="group relative hidden overflow-hidden rounded-md border border-white/10 bg-white/5 px-5 py-2 transition-all hover:border-white/20 sm:flex"
            >
              <span className="relative z-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/80 transition-colors group-hover:text-white">
                GET_QUOTE
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white/60 transition-colors hover:border-white/20 hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-b border-white/10 bg-glass-heavy backdrop-blur-xl transition-all duration-300 md:hidden",
          isMobileMenuOpen ? "max-h-96" : "max-h-0 border-transparent",
        )}
      >
        <div className="space-y-1 px-6 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "block rounded-md px-4 py-3 text-sm transition-colors hover:bg-white/5",
                link.highlight
                  ? "flex items-center gap-2 text-purple-400"
                  : "text-white/60 hover:text-white",
              )}
            >
              {link.highlight && <Sparkles className="h-4 w-4" />}
              {link.label}
              {link.highlight && (
                <span className="ml-auto rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-400">
                  Waitlist
                </span>
              )}
            </Link>
          ))}
          <div className="flex justify-center py-2">
            <ThemeToggle className="w-full justify-center" />
          </div>
          <Link
            href="/quote"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs uppercase tracking-wider text-white/80 transition-all hover:border-white/20 hover:text-white"
          >
            GET_QUOTE
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;