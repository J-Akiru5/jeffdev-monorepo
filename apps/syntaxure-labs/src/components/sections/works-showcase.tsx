"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { HoverCard } from "@syntaxure/ui";
import type { DataProject } from "@/lib/data";

interface WorksShowcaseProps {
  projects: DataProject[];
}

export function WorksShowcase({ projects: featuredProjects }: WorksShowcaseProps) {
  const { ref: headerRef, isInView: headerInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: carouselRef, isInView: carouselInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement;
    if (!card) return;
    container.scrollTo({
      left: card.offsetLeft - container.offsetLeft - 24,
      behavior: "smooth",
    });
  }, []);

  const handlePrev = () => {
    const next = Math.max(0, activeIndex - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  const handleNext = () => {
    const next = Math.min(featuredProjects.length - 1, activeIndex + 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  if (featuredProjects.length === 0) return null;

  return (
    <section className="relative py-24 md:py-32" id="work">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* ── Section Header ── */}
        <div ref={headerRef} className={`flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 transition-all duration-700 ease-out ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Featured Work
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
              Our Recent Projects
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Real results. Real impact. Here&apos;s what we&apos;ve shipped.
            </p>
          </div>

          {/* ── Navigation ── */}
          <div className="hidden sm:flex items-center gap-2 mt-6 sm:mt-0">
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-colors hover:border-[var(--text-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] shadow-sm"
              aria-label="Previous project"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIndex === featuredProjects.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-colors hover:border-[var(--text-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] shadow-sm"
              aria-label="Next project"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <Link
              href="/work"
              className="ml-4 flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View All
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Carousel ── */}
        <div
          ref={carouselRef}
          className={`transition-all duration-1000 ease-out delay-100 ${
            carouselInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
            onScroll={(e) => {
              const container = e.currentTarget;
              const cardWidth = container.children[0]?.clientWidth || 400;
              const idx = Math.round(container.scrollLeft / (cardWidth + 24));
              setActiveIndex(Math.max(0, Math.min(featuredProjects.length - 1, idx)));
            }}
          >
            {featuredProjects.map((project, idx) => (
              <Link
                key={project.slug}
                href={`/work/${project.slug}`}
                className="group flex flex-col flex-shrink-0 w-[85vw] sm:w-[400px] lg:w-[440px] snap-center outline-none"
              >
                <HoverCard className="flex flex-col h-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-8 transition-all duration-300 hover:border-[var(--text-tertiary)] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                {/* Category Badge */}
                <div className="mb-6 flex justify-between items-start">
                  <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-2 py-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    {project.category}
                  </span>
                  <div className="text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--text-primary)]">
                    <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </div>

                {/* Title + Client */}
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {project.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-[var(--text-tertiary)]">
                  {project.client}
                </p>

                {/* Tagline */}
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-2 flex-grow">
                  {project.tagline}
                </p>

                {/* Technologies */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="rounded-sm border border-transparent bg-transparent px-1 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>

                {/* Results */}
                <div className="mt-6 grid grid-cols-3 gap-3 pt-5 border-t border-[var(--border-subtle)]">
                  {project.results.map((result) => (
                    <div key={result.metric} className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {result.value}
                      </div>
                      <div className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] leading-tight">
                        {result.metric}
                      </div>
                    </div>
                  ))}
                </div>
                </HoverCard>
              </Link>
            ))}
          </div>

          {/* Dot Indicators (mobile) */}
          <div className="mt-2 flex justify-center gap-2 sm:hidden">
            {featuredProjects.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  scrollToIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-6 bg-[var(--text-secondary)]"
                    : "w-2 bg-[var(--border-subtle)] hover:bg-[var(--text-tertiary)]"
                }`}
                aria-label={`Go to project ${idx + 1}`}
              />
            ))}
          </div>

          {/* Mobile View All link */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View All Case Studies
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorksShowcase;
