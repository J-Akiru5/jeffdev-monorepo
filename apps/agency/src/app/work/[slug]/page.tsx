import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Quote } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import { getProjectBySlug, getProjects } from '@/lib/data';
import type { Metadata } from 'next';

/**
 * Project Detail Page
 * -------------------
 * Individual case study with challenge, solution,
 * results, and testimonial.
 * Fetches data from Firestore.
 */

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return { title: 'Project Not Found' };
  }

  return {
    title: `${project.title} — Case Study`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Get other projects for cross-linking
  const allProjects = await getProjects();
  const otherProjects = allProjects
    .filter((p) => p.slug !== project.slug)
    .slice(0, 2);

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All Projects
            </Link>

            <div className="mt-8 max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {project.category}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                {project.title}
              </h1>
              <p className="mt-2 text-lg text-white/50">{project.client}</p>
              <p className="mt-6 text-xl leading-relaxed text-white/60">
                {project.description}
              </p>
            </div>

            {/* Results Banner */}
            <div className="mt-12 grid gap-4 rounded-md border border-white/[0.08] bg-white/[0.02] p-8 sm:grid-cols-3">
              {project.results.map((result) => (
                <div key={result.metric} className="text-center">
                  <div className="text-3xl font-bold text-gradient-holographic">
                    {result.value}
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-white/40">
                    {result.metric}
                  </div>
                </div>
              ))}
            </div>

            {/* Cover Image */}
            {project.image && (
              <div className="mt-12 overflow-hidden rounded-md border border-white/[0.08]">
                <img
                  src={project.image}
                  alt={`${project.title} cover`}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}
          </div>
        </section>

        {/* Challenge & Solution */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Challenge */}
              <div>
                <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
                  The Challenge
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-white/70">
                  {project.challenge}
                </p>
              </div>

              {/* Solution */}
              <div>
                <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
                  Our Solution
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-white/70">
                  {project.solution}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technologies */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              Technologies Used
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-white/70"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        {project.testimonial && (
          <section className="px-6 py-16 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-8">
                <Quote className="h-8 w-8 text-cyan-400/50" />
                <blockquote className="mt-4 text-xl leading-relaxed text-white/80">
                  &ldquo;{project.testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-6">
                  <div className="font-semibold text-white">
                    {project.testimonial.author}
                  </div>
                  <div className="text-sm text-white/50">
                    {project.testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other Projects */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-white">More Case Studies</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {otherProjects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/work/${p.slug}`}
                  className="group flex items-center gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div className="flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
                      {p.category}
                    </span>
                    <div className="mt-1 font-semibold text-white">{p.title}</div>
                    <div className="mt-0.5 text-sm text-white/50">
                      {p.tagline}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
