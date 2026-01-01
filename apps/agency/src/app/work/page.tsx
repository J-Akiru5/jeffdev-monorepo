import Link from 'next/link';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import { getProjects, getFeaturedProjects } from '@/lib/data';
import type { Metadata } from 'next';

/**
 * Work Page
 * ---------
 * Case studies and portfolio projects.
 * Fetches data from Firestore.
 */

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies and success stories. See how we help startups and enterprises build high-performance web systems that drive growth.',
};

export default async function WorkPage() {
  const allProjects = await getProjects();
  const featuredProjects = await getFeaturedProjects();
  const otherProjects = allProjects.filter((p) => !p.featured);

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Page Header */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
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
            <div className="mt-6 grid gap-6">
              {featuredProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/work/${project.slug}`}
                  className="group relative overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.02] transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
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
                    className="group flex items-start gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
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

        <CTA />
      </main>
      <Footer />
    </>
  );
}
