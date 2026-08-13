import { createElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import { ServiceInvestmentCard } from "@/components/services/service-investment-card";
import { getServiceBySlug, getServices } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { services as staticServices } from "@/data/services";
import type { Metadata } from "next";

/**
 * Service Detail Page
 * -------------------
 * Individual service with full description,
 * features, deliverables, and investment info.
 * Fetches data from Firestore.
 */

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await getServices();
  const source = services.length > 0 ? services : staticServices;
  return source.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbService = await getServiceBySlug(slug);
  const fallbackService = staticServices.find((item) => item.slug === slug);

  if (!dbService && !fallbackService) {
    return { title: "Service Not Found" };
  }

  const activeService = dbService ?? fallbackService!;

  return {
    title: `${activeService.title} | Syntaxure Labs`,
    description: activeService.description,
    alternates: {
      canonical: `/services/${slug}`,
    },
    openGraph: {
      title: `${activeService.title} | Syntaxure Labs`,
      description: activeService.description,                      url: `https://www.syntaxure.dev/services/${slug}`,
                      siteName: 'Syntaxure Labs',
                      type: 'website',
                      images: [{ url: 'https://www.syntaxure.dev/syntaxure-business-card.png', width: 1200, height: 630, alt: activeService.title }],
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  const fallbackService = staticServices.find((item) => item.slug === slug);

  if (!service && !fallbackService) {
    notFound();
  }

  // Get other services for cross-linking
  const allServices = await getServices();
  const serviceList = allServices.length > 0 ? allServices : staticServices;
  const activeSlug = service?.slug ?? fallbackService?.slug ?? slug;
  const otherServices = serviceList
    .filter((s) => s.slug !== activeSlug)
    .slice(0, 2);

  const activeService = service ?? {
    slug: fallbackService!.slug,
    icon: fallbackService!.icon.name,
    title: fallbackService!.title,
    tagline: fallbackService!.tagline,
    description: fallbackService!.description,
    features: fallbackService!.features,
    deliverables: fallbackService!.deliverables,
    investment: {
      starting: fallbackService!.investment.startingPrice > 0
        ? `PHP ${fallbackService!.investment.startingPrice.toLocaleString()}`
        : "Custom quote",
      timeline: fallbackService!.investment.timeline,
    },
    order: 0,
  };

  return (
    <>
      <Header />
      <main className="pt-32 pb-16">
        {/* Desktop Absolute Back Button (Sits on the left side, professional style) */}
        <div className="hidden xl:flex absolute left-[max(2rem,calc(50%-54rem))] top-36 z-50">
          <Link
            href="/services"
            className="group flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            All Services
          </Link>
        </div>

        {/* BreadcrumbList JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Services', item: 'https://www.syntaxure.dev/services' },
                { '@type': 'ListItem', position: 2, name: activeService.title, item: `https://www.syntaxure.dev/services/${slug}` },
              ],
            }),
          }}
        />
        {/* Hero Section */}
        <section className="px-6 pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl relative">
            {/* Mobile/Tablet: Back button */}
            <div className="mb-8 xl:hidden">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-0.5" />
                All Services
              </Link>
            </div>

            <div className="mt-8 grid gap-12 lg:grid-cols-2">
              {/* Left: Content */}
              <div>
                <div className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                  {createElement(getIcon(activeService.icon), {
                    className: "h-8 w-8 text-cyan-500 dark:text-cyan-400",
                  })}
                </div>

                <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
                  {activeService.title}
                </h1>
                <p className="mt-2 font-mono text-sm text-cyan-500 dark:text-cyan-400">
                  {activeService.tagline}
                </p>
                <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
                  {activeService.description}
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href={`/quote?service=${slug}`}
                    className="group relative overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  >                      <span className="relative z-10 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-[var(--text-primary)]">
                      Get_Quote
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                  <Link
                    href="/contact"
                    className="group flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-3 backdrop-blur-md transition-all hover:border-[var(--text-tertiary)]"
                  >
                    <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
                      Book_Call
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right: Investment Card (Client Component for currency) */}
              <ServiceInvestmentCard
                investment={activeService.investment}
                deliverables={activeService.deliverables}
              />
            </div>
          </div>
        </section>

        {/* Other Services */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Other Services</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {otherServices.map((s) => {
                const otherIconComponent =
                  typeof s.icon === "string" ? getIcon(s.icon) : s.icon;
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="group flex items-center gap-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-primary)]"
                  >
                    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2">
                      {createElement(otherIconComponent, {
                        className: "h-5 w-5 text-cyan-500 dark:text-cyan-400",
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text-primary)]">{s.title}</div>
                      <div className="mt-0.5 text-sm text-[var(--text-secondary)]">
                        {s.tagline}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
