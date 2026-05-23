'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { MHTLogo } from '@/components/ui/mht-logo';
import { MHTButton } from '@/components/ui/mht-button';

const navLinks = [
  { label: 'Nexure Networks', href: '/nexure' },
  { label: 'Joularix Solar', href: '/joularix' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <MHTLogo className="h-8 w-8 transition-transform group-hover:scale-105" />
            <span className="text-lg font-bold tracking-tight text-slate-800">
              MHT
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                id={`nav-${link.href.slice(1)}`}
                className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-100/60"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <MHTButton variant="outline" size="sm" id="nav-subscriber-portal">
                Subscriber Portal
              </MHTButton>
            </Link>
            <Link href="/quote">
              <MHTButton variant="blue" size="sm" id="nav-get-quote">
                Get a Quote
              </MHTButton>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="nav-mobile-toggle"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-black/[0.06] mt-2 pt-4 space-y-1 animate-fade-in-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100/80"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <MHTButton variant="outline" size="md" className="w-full">
                  Subscriber Portal
                </MHTButton>
              </Link>
              <Link href="/quote" onClick={() => setMobileOpen(false)}>
                <MHTButton variant="blue" size="md" className="w-full">
                  Get a Quote
                </MHTButton>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
