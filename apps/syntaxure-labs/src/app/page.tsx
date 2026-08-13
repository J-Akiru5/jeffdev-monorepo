import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FAQSection } from "@/components/sections/faq-section";
import { HowWeWork } from "@/components/sections/how-we-work";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { SocialProof } from "@/components/sections/social-proof";
import { Services } from "@/components/sections/services";
import { WorksShowcase } from "@/components/sections/works-showcase";
import { Features } from "@/components/sections/features";
import { PrismHighlight } from "@/components/sections/prism-highlight";
import { AgenticProtocol } from "@/components/sections/agentic-protocol";
import { CTASection } from "@/components/sections/cta-section";
import { getFeaturedProjects, getServices } from "@/lib/data";
import { services as staticServices } from "@/data/services";
import { getPageContent } from "@/lib/cms";
import { HOMEPAGE_DEFAULTS } from "@/data/cms-defaults";

export const revalidate = 60;

export default async function HomePage() {
  const [featuredProjects, dbServices, cms] = await Promise.all([
    getFeaturedProjects(),
    getServices(),
    getPageContent("homepage"),
  ]);

  const content = { ...HOMEPAGE_DEFAULTS, ...cms };

  // Use DB services if available, fallback to static data
  const services = dbServices.length > 0 ? dbServices : staticServices.map((svc, idx) => ({
    slug: svc.slug,
    icon: svc.slug.includes("web") ? "web" : svc.slug.includes("saas") ? "saas" : svc.slug.includes("cloud") ? "cloud" : "ai",
    title: svc.title,
    tagline: svc.tagline,
    description: svc.description,
    features: svc.features,
    deliverables: svc.deliverables,
    investment: { starting: "Custom quote. Tell us your budget", timeline: svc.investment.timeline },
    order: idx,
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does Syntaxure Labs do?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Syntaxure Labs is a global B2B digital transformation agency specializing in scalable custom software, web architectures, and secure AI integrations. We partner with enterprises to modernize operations, converting slow manual workflows into high-performance digital solutions."
        }
      },
      {
        "@type": "Question",
        "name": "What is Context Engine?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Context Engine is a proprietary AI Governance layer that enforces strict protocols and actively prevents AI hallucinations in enterprise environments. It is our flagship product that demonstrates our deep expertise in AI architecture."
        }
      },
      {
        "@type": "Question",
        "name": "Where is Syntaxure Labs based?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We are based in Iloilo City, Philippines, rooted in the emerging innovation ecosystem of Western Visayas. We operate globally, delivering enterprise-grade engineering standards to clients worldwide."
        }
      },
      {
        "@type": "Question",
        "name": "What services does Syntaxure Labs offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer custom software development, SaaS platform architecture, cloud infrastructure deployment, AI integration services, and high-performance web development. All services are delivered with fixed-investment pricing and predictable timelines."
        }
      },
      {
        "@type": "Question",
        "name": "How do I start a project with Syntaxure Labs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Contact us through our website to discuss your project requirements. We provide a free consultation, scope your project, and deliver a fixed-price investment estimate within 24 hours."
        }
      }
    ]
  };

  return (
    <>
      {/* FAQ Schema for AI Overviews */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      <main>
        <HeroSection cmsHero={content.hero} />
        <SocialProof />
        <Services services={services} />
        <WorksShowcase projects={featuredProjects} />
        <Features />
        <PrismHighlight cmsData={content.prismHighlight} />
        <AgenticProtocol />
        <HowWeWork />
        <FAQSection />

        {/* Blog preview link */}
        <section className="px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <span className="font-mono text-xs uppercase tracking-wider">
                  Insights and Updates
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <CTASection cmsCta={content.cta} />
      </main>
      <Footer />
    </>
  );
}
