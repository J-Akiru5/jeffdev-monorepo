import Link from "next/link";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import { getProjects, getFeaturedProjects } from "@/lib/data";
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
  const allProjects = await getProjects();
  const featuredProjects = await getFeaturedProjects();
  const otherProjects = allProjects.filter((p) => !p.featured);

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
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Our Work
              </h1>
              <p className="mt-4 text-lg text-white/50">
                Real projects. Real results. Here&apos;s how we&apos;ve helped
                businesses build systems that scale.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="px-6 pb-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              Featured Projects
            </h2>

            {allProjects.length === 0 ? (
              <div className="mt-6 rounded-md border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <ArrowUpRight className="h-6 w-6 text-white/30" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  Portfolio Coming Soon
                </h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-white/50">
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
                  className="group relative overflow-hidden glass-neon glass-shimmer transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
                >
                  <div className="grid gap-6 p-8 lg:grid-cols-2">
                    {/* Left: Content */}
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider text-cyan-400/70">
                        {project.category}
                      </span>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        {project.client}
                      </p>
                      <p className="mt-4 text-white/60">{project.tagline}</p>

                      {/* Technologies */}
                      <div className="mt-6 flex flex-wrap gap-2">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Results */}
                    <div className="flex items-center">
                      <div className="grid w-full grid-cols-3 gap-4">
                        {project.results.map((result) => (
                          <div key={result.metric} className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {result.value}
                            </div>
                            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
                              {result.metric}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="absolute right-6 top-8 text-white/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-400">
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
              <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
                More Projects
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {otherProjects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/work/${project.slug}`}
                    className="group flex items-start gap-4 glass-neon glass-shimmer p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="flex-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
                        {project.category}
                      </span>
                      <div className="mt-1 font-semibold text-white">
                        {project.title}
                      </div>
                      <div className="mt-0.5 text-sm text-white/50">
                        {project.tagline}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-white/30 transition-colors group-hover:text-white" />
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
