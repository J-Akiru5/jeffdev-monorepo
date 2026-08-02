import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import { getProjects, getFeaturedProjects } from "@/lib/data";
import { projects as staticProjects } from "@/data/projects";
import type { Metadata } from "next";

/**
 * Work Page
 * ---------
 * Case studies and portfolio projects.
 * Fetches data from Firestore.
 */

export const metadata: Metadata = {
  title: "Case Studies & Portfolio",
  description:
    "Real projects, real results. Explore our portfolio of enterprise web applications, SaaS platforms, and digital transformation case studies.",
};

export default async function WorkPage() {
  const dbProjects = await getProjects();
  const allProjects = dbProjects.length > 0 ? dbProjects : staticProjects;
  const dbFeatured = await getFeaturedProjects();
  const featuredProjects = dbFeatured.length > 0 ? dbFeatured : staticProjects.filter((p) => p.featured);
  const otherProjects = allProjects.filter((p) => !(p as any).featured && !featuredProjects.some((f) => f.slug === p.slug));

  return (
    <>
      <Header />
      <main className="pt-20 pb-16">
        {/* Desktop Absolute Back Button (Sits on the left side, professional style) */}
        <div className="hidden xl:flex absolute left-[max(2rem,calc(50%-54rem))] top-24 z-50">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <section className="px-6 pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl relative">
            {/* Mobile/Tablet: Back button */}
            <div className="mb-8 xl:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>
            <div className="mt-8 max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {"// Case Studies"}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
                Our Work
              </h1>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Real projects. Real results. Here&apos;s how we&apos;ve helped
                businesses build systems that scale.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="px-6 pb-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              Featured Projects
            </h2>

            {allProjects.length === 0 ? (
              <div className="mt-6 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <ArrowUpRight className="h-6 w-6 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
                  Portfolio Coming Soon
                </h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-[var(--text-secondary)]">
                  We are a young company currently building our first featured projects.
                  In the meantime, let us know about your project and we can start building together.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-md border border-cyan-500/50 bg-cyan-500/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20"
                  >
                    Start Your Project
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
              {featuredProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/work/${project.slug}`}
                  className="group relative overflow-hidden glass-neon glass-shimmer transition-all duration-300 hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-primary)]"
                >
                  <div className="grid gap-6 p-8 lg:grid-cols-2">
                    {/* Left: Content */}
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider text-cyan-500/70 dark:text-cyan-400/70">
                        {(project as any).category || ""}
                      </span>
                      <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {(project as any).client || ""}
                      </p>
                      <p className="mt-4 text-[var(--text-secondary)]">{(project as any).tagline || ""}</p>

                      {/* Technologies */}
                      <div className="mt-6 flex flex-wrap gap-2">
                        {((project as any).technologies || []).slice(0, 5).map((tech: string) => (
                          <span
                            key={tech}
                            className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Services Delivered */}
                      {(project as any).services && (project as any).services.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {((project as any).services as string[]).slice(0, 4).map((service: string) => (
                            <span
                              key={service}
                              className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400/80"
                            >
                              {service}
                            </span>
                          ))}
                          {((project as any).services as string[]).length > 4 && (
                            <span className="rounded-sm border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400/50">
                              +{((project as any).services as string[]).length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Live Site Badge */}
                      {(project as any).publishedSiteUrl && (
                        <div className="mt-4">
                          <span className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Hero Image or Results */}
                    <div className="flex items-center">
                      {(project as any).image ? (
                        <div className="w-full overflow-hidden flex items-center justify-center relative aspect-[16/10]">
                          <Image
                            src={(project as any).image}
                            alt={`${project.title} preview`}
                            fill
                            className="object-contain transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        </div>
                      ) : (
                        <div className="grid w-full grid-cols-3 gap-4">
                          {((project as any).results || []).map((result: { metric: string; value: string }) => (
                            <div key={result.metric} className="text-center">
                              <div className="text-2xl font-bold text-[var(--text-primary)]">
                                {result.value}
                              </div>
                              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                                {result.metric}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="absolute right-6 top-8 text-[var(--text-tertiary)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-500 dark:group-hover:text-cyan-400">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>

                  {/* Hover gradient */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <section className="px-6 pb-24 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                More Projects
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {otherProjects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/work/${project.slug}`}
                    className="group flex items-start gap-4 glass-neon glass-shimmer p-6 transition-all hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-primary)]"
                  >
                    <div className="flex-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/70 dark:text-cyan-400/70">
                        {project.category}
                      </span>
                      <div className="mt-1 font-semibold text-[var(--text-primary)]">
                        {project.title}
                      </div>
                      <div className="mt-0.5 text-sm text-[var(--text-secondary)]">
                        {project.tagline}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
