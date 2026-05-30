"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DataProject } from "@/lib/data";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface WorksShowcaseProps {
  projects: DataProject[];
}

export function WorksShowcase({ projects: featuredProjects }: WorksShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const container = carouselRef.current;
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

  // Track scroll position to update active dot
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.children[0]?.clientWidth || 400;
      const idx = Math.round(scrollLeft / (cardWidth + 16));
      setActiveIndex(Math.max(0, Math.min(featuredProjects.length - 1, idx)));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [featuredProjects.length]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(
        [headerRef.current, carouselRef.current],
        { opacity: 1, y: 0, clearProps: "all" },
      );
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        carouselRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          scrollTrigger: {
            trigger: carouselRef.current,
            start: "top 85%",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (featuredProjects.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32" id="work">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="flex items-end justify-between mb-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              {"// Featured Work"}
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Our Recent{" "}
              <span className="text-gradient-holographic">Projects</span>
            </h2>
            <p className="mt-2 text-white/50">
              Real results. Real impact. Here&apos;s what we&apos;ve shipped.
            </p>
          </div>

          {/* Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="flex h-10 w-10 items-center justify-center glass rounded-lg transition-all hover:border-white/20 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-white/60"
              aria-label="Previous project"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIndex === featuredProjects.length - 1}
              className="flex h-10 w-10 items-center justify-center glass rounded-lg transition-all hover:border-white/20 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-white/60"
              aria-label="Next project"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <Link
              href="/work"
              className="ml-2 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-cyan-400/70 hover:text-cyan-400 transition-colors"
            >
              View All
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        >
          {featuredProjects.map((project, idx) => (
            <Link
              key={project.slug}
              href={`/work/${project.slug}`}
              className="group flex-shrink-0 w-[85vw] sm:w-[400px] lg:w-[440px] snap-center glass-neon glass-shimmer rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              {/* Category Badge */}
              <span className="inline-block font-mono text-[10px] uppercase tracking-wider text-cyan-400/70 mb-4 px-2 py-1 rounded-sm border border-cyan-500/20 bg-cyan-500/5">
                {project.category}
              </span>

              {/* Title + Client */}
              <h3 className="text-xl font-semibold text-white group-hover:text-cyan-50 transition-colors">
                {project.title}
              </h3>
              <p className="mt-1 text-sm text-white/50">{project.client}</p>

              {/* Tagline */}
              <p className="mt-3 text-sm leading-relaxed text-white/55 line-clamp-2">
                {project.tagline}
              </p>

              {/* Technologies */}
              <div className="mt-5 flex flex-wrap gap-2">
                {project.technologies.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-sm border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/50"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="rounded-sm border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>

              {/* Results */}
              <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                {project.results.map((result) => (
                  <div key={result.metric} className="text-center">
                    <div className="text-lg font-bold text-cyan-400">
                      {result.value}
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/30 leading-tight">
                      {result.metric}
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow indicator */}
              <div className="absolute top-6 right-6 text-white/20 transition-all duration-300 group-hover:text-cyan-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight className="h-5 w-5" />
              </div>

              {/* Card index indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400/60">
                  {idx + 1}/{featuredProjects.length}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Dot Indicators (mobile) */}
        <div className="mt-6 flex justify-center gap-2 sm:hidden">
          {featuredProjects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                scrollToIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to project ${idx + 1}`}
            />
          ))}
        </div>

        {/* Mobile View All link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-cyan-400/70 hover:text-cyan-400 transition-colors"
          >
            View All Case Studies
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WorksShowcase;
