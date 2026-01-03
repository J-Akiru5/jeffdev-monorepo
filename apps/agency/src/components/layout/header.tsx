'use client';

/**
 * Header Component
 * ----------------
 * Sticky glass navigation with:
 * - Logo/Brand mark
 * - Navigation links (feature-flag aware)
 * - Mobile menu
 * - "Get Quote" CTA (Ghost Glow style)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/components/providers/feature-flag-provider';

interface NavLink {
  href: string;
  label: string;
  highlight?: boolean;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { prismEngineEnabled, prismEngineTeaser } = useFeatureFlags();

  // Build navigation links based on feature flags
  const navLinks: NavLink[] = [
    // Prism Context Engine - always show as main product
    { href: 'https://prism.jeffdev.studio', label: 'Prism Context Engine', highlight: true },
    { href: '/services', label: 'Services' },
    { href: '/work', label: 'Work' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  // Track scroll position for glass effect intensity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-void/80 backdrop-blur-xl border-b border-white/8'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
              <Image
                src="/favicon.svg"
                alt="JD Studio"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="hidden font-semibold tracking-tight text-white sm:block">
              JD Studio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 text-sm transition-colors',
                  link.highlight
                    ? 'flex items-center gap-1.5 text-purple-400 hover:text-purple-300'
                    : 'text-white/70 hover:text-white'
                )}
              >
                {link.highlight && <Sparkles className="h-3.5 w-3.5" />}
                {link.label}
                {link.highlight && (
                  <span className="ml-1 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] uppercase">
                    New
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Ghost Glow CTA Button */}
            <Link
              href="/quote"
              className="group relative hidden overflow-hidden rounded-md border border-white/10 bg-black/50 px-5 py-2 backdrop-blur-md transition-all hover:border-white/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] sm:flex"
            >
              <span className="relative z-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/80 transition-colors group-hover:text-white">
                Get_Quote
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 z-0 bg-linear-to-r from-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white/70 transition-colors hover:border-white/20 hover:text-white md:hidden"
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

      {/* Mobile Menu */}
      <div
        className={cn(
          'overflow-hidden border-b border-white/8 bg-void/95 backdrop-blur-xl transition-all duration-300 md:hidden',
          isMobileMenuOpen ? 'max-h-96' : 'max-h-0 border-transparent'
        )}
      >
        <div className="space-y-1 px-6 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block rounded-md px-4 py-3 text-sm transition-colors hover:bg-white/5',
                link.highlight
                  ? 'flex items-center gap-2 text-purple-400'
                  : 'text-white/70 hover:text-white'
              )}
            >
              {link.highlight && <Sparkles className="h-4 w-4" />}
              {link.label}
              {link.highlight && (
                <span className="ml-auto rounded bg-purple-500/20 px-2 py-0.5 text-[10px] uppercase">
                  New
                </span>
              )}
            </Link>
          ))}
          <Link
            href="/quote"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-md border border-white/10 bg-black/50 px-4 py-3 font-mono text-xs uppercase tracking-wider text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            Get_Quote
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
