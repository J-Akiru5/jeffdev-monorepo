import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, Quote } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import { getProjectBySlug, getProjects } from "@/lib/data";
import { projects as staticProjects } from "@/data/projects";
import type { Metadata } from "next";

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
  const source = projects.length > 0 ? projects : staticProjects;
  return source.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbProject = await getProjectBySlug(slug);
  const fallbackProject = staticProjects.find((item) => item.slug === slug);

  if (!dbProject && !fallbackProject) {
    return { title: "Project Not Found" };
  }

  const activeProject = dbProject ?? fallbackProject!;

  return {
    title: `${activeProject.title} - Case Study | Syntaxure Labs`,
    description: activeProject.description,
    alternates: {
      canonical: `/work/${slug}`,
    },
    openGraph: {
      title: `${activeProject.title} - Case Study | Syntaxure Labs`,
      description: activeProject.description,
      url: `https://www.syntaxure.dev/work/${slug}`,
      siteName: 'Syntaxure Labs',
      type: 'article',
      images: activeProject.image
        ? [{ url: activeProject.image, width: 1200, height: 630, alt: activeProject.title }]
        : [{ url: 'https://www.syntaxure.dev/syntaxure-business-card.png', width: 1200, height: 630, alt: activeProject.title }],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  const fallbackProject = staticProjects.find((item) => item.slug === slug);

  if (!project && !fallbackProject) {
    notFound();
  }

  // Get other projects for cross-linking
  const allProjects = await getProjects();
  const projectList = allProjects.length > 0 ? allProjects : staticProjects;
  const activeSlug = project?.slug ?? fallbackProject?.slug ?? slug;
  const activeProject = project ?? fallbackProject!;
  const otherProjects = projectList
    .filter((p) => p.slug !== activeSlug)
    .slice(0, 2);

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* BreadcrumbList JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Work', item: 'https://www.syntaxure.dev/work' },
                { '@type': 'ListItem', position: 2, name: activeProject.title, item: `https://www.syntaxure.dev/work/${slug}` },
              ],
            }),
          }}
        />
        {/* Hero Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              All Projects
            </Link>

            <div className="mt-8 max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-500 dark:text-cyan-400">
                {activeProject.category}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
                {activeProject.title}
              </h1>
              <p className="mt-2 text-lg text-[var(--text-secondary)]">
                {activeProject.client}
              </p>
              <p className="mt-6 text-xl leading-relaxed text-[var(--text-secondary)]">
                {activeProject.description}
              </p>

              {/* Live Site CTA — only shown when publishedSiteUrl is set */}
              {(activeProject as { publishedSiteUrl?: string | null }).publishedSiteUrl && (
                <div className="mt-8">
                  <a
                    href={(activeProject as { publishedSiteUrl?: string | null }).publishedSiteUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40
                               bg-emerald-500/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider
                               text-emerald-400 backdrop-blur-md transition-all
                               hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit Live Site
                  </a>
                </div>
              )}
            </div>

            {/* Results Banner */}
            <div className="mt-12 grid gap-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 sm:grid-cols-3">
              {activeProject.results.map((result) => (
                <div key={result.metric} className="text-center">
                  <div className="text-3xl font-bold text-gradient-holographic">
                    {result.value}
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                    {result.metric}
                  </div>
                </div>
              ))}
            </div>

            {/* Cover Image */}
            {activeProject.image && (
              <div className="mt-12 overflow-hidden rounded-md border border-[var(--border-subtle)] relative aspect-[21/9]">
                <Image
                  src={activeProject.image}
                  alt={`${activeProject.title} cover`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
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
                <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  The Challenge
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                  {activeProject.challenge}
                </p>
              </div>

              {/* Solution */}
              <div>
                <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  Our Solution
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                  {activeProject.solution}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technologies */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">                <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  Technologies Used
                </h2>
                <div className="mt-6 flex flex-wrap gap-3">
                  {activeProject.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 font-mono text-sm text-[var(--text-secondary)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        {activeProject.testimonial && (
          <section className="px-6 py-16 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8">
                <Quote className="h-8 w-8 text-cyan-500/50 dark:text-cyan-400/50" />
                <blockquote className="mt-4 text-xl leading-relaxed text-[var(--text-primary)]">
                  &ldquo;{activeProject.testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-6">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {activeProject.testimonial.author}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {activeProject.testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other Projects */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">More Case Studies</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {otherProjects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/work/${p.slug}`}
                  className="group flex items-center gap-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-primary)]"
                >
                  <div className="flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/70 dark:text-cyan-400/70">
                      {p.category}
                    </span>
                    <div className="mt-1 font-semibold text-[var(--text-primary)]">
                      {p.title}
                    </div>
                    <div className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      {p.tagline}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
