'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@jdstudio/ui';

export interface LegalSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  children: React.ReactNode;
}

/**
 * @component LegalPageLayout
 * @description Reusable layout for legal pages (Terms, Privacy) with a sticky
 * Table of Contents sidebar on desktop and a "Last Updated" badge.
 * Uses the MHT "Enterprise White Glassmorphism" design system.
 */
export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  sections,
  children,
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 96;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 sm:py-20" id="legal-content">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="max-w-4xl mb-10">
          {/* Last Updated Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <Calendar className="h-3.5 w-3.5 text-blue-500" strokeWidth={2} />
            <span className="text-xs font-semibold text-blue-600 tracking-wide">
              Last Updated: {lastUpdated}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-10 lg:gap-14 relative">
          {/* Sticky Table of Contents — Desktop Only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <nav
                className="rounded-xl bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-5"
                aria-label="Table of Contents"
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Contents
                </h2>
                <ul className="space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-all duration-200',
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        <span className="shrink-0 opacity-60">{section.icon}</span>
                        <span className="truncate">{section.title}</span>
                        {activeSection === section.id && (
                          <ChevronRight className="h-3 w-3 ml-auto text-blue-500 shrink-0" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Legal Content */}
          <div className="flex-1 min-w-0 max-w-4xl">
            {/* Mobile ToC (Collapsible) */}
            <details className="lg:hidden mb-8 rounded-xl bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <summary className="px-5 py-3.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                📋 Table of Contents
              </summary>
              <ul className="px-5 pb-4 space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={(e) => {
                        scrollToSection(section.id);
                        // Close details on click
                        const details = (e.target as HTMLElement).closest('details');
                        if (details) details.removeAttribute('open');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <span className="shrink-0 opacity-60">{section.icon}</span>
                      <span>{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>

            {/* Rendered Legal Sections */}
            <div className="space-y-10">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * @component LegalSectionBlock
 * @description Individual section block for legal pages with an icon header and prose content.
 */
export function LegalSectionBlock({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className="scroll-mt-24 rounded-xl bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-6 sm:p-8 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">{title}</h2>
      </div>

      {/* Section Content — Prose-like styling */}
      <div className="legal-prose text-[15px] text-slate-600 leading-[1.8] space-y-4">
        {children}
      </div>
    </article>
  );
}
