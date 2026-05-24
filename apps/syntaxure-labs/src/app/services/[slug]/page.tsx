import { createElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
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
  const service = await getServiceBySlug(slug);

  if (!service) {
    return { title: "Service Not Found" };
  }

  return {
    title: `${service.title} // Syntaxure Labs`,
    description: service.description,
    alternates: {
      canonical: `/services/${slug}`,
    },
    openGraph: {
      title: `${service.title} | Syntaxure Labs`,
      description: service.description,
      url: `/services/${slug}`,
      siteName: 'Syntaxure Labs',
      type: 'website',
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
      starting: `PHP ${fallbackService!.investment.startingPrice.toLocaleString()}`,
      timeline: fallbackService!.investment.timeline,
    },
    order: 0,
  };

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
                { '@type': 'ListItem', position: 1, name: 'Services', item: 'https://www.syntaxure.dev/services' },
                { '@type': 'ListItem', position: 2, name: activeService.title, item: `https://www.syntaxure.dev/services/${slug}` },
              ],
            }),
          }}
        />
        {/* Hero Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All Services
            </Link>

            <div className="mt-8 grid gap-12 lg:grid-cols-2">
              {/* Left: Content */}
              <div>
                <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-3">
                  {createElement(getIcon(activeService.icon), {
                    className: "h-8 w-8 text-cyan-400",
                  })}
                </div>

                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
                  {activeService.title}
                </h1>
                <p className="mt-2 font-mono text-sm text-cyan-400">
                  {activeService.tagline}
                </p>
                <p className="mt-6 text-lg leading-relaxed text-white/60">
                  {activeService.description}
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/quote"
                    className="group relative overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  >
                    <span className="relative z-10 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white">
                      Get_Quote
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                  <Link
                    href="/contact"
                    className="group flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-6 py-3 backdrop-blur-md transition-all hover:border-white/20"
                  >
                    <span className="font-mono text-sm uppercase tracking-wider text-white/70 transition-colors group-hover:text-white">
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

        {/* Features Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-white">
              What&apos;s Included
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeService.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                  <span className="text-sm text-white/70">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Services */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-white">Other Services</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {otherServices.map((s) => {
                const otherIconComponent =
                  typeof s.icon === "string" ? getIcon(s.icon) : s.icon;
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="group flex items-center gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="rounded-md border border-white/10 bg-white/5 p-2">
                      {createElement(otherIconComponent, {
                        className: "h-5 w-5 text-cyan-400",
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{s.title}</div>
                      <div className="mt-0.5 text-sm text-white/50">
                        {s.tagline}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-white" />
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
