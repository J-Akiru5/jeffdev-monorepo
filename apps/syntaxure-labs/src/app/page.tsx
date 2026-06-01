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
    investment: { starting: `₱${svc.investment.startingPrice.toLocaleString()}`, timeline: svc.investment.timeline },
    order: idx,
  }));

  return (
    <>
      <Header />
      <main>
        <HeroSection cmsHero={content.hero} />
        <SocialProof />
        <Services services={services} />
        <WorksShowcase projects={featuredProjects} />
        <Features />
        <PrismHighlight cmsData={content.prismHighlight} />
        <AgenticProtocol />
        <CTASection cmsCta={content.cta} />
      </main>
      <Footer />
    </>
  );
}
