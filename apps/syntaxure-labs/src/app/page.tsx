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
import { getFeaturedProjects } from "@/lib/data";
import { getServices } from "@/lib/data";

export default async function HomePage() {
  const [featuredProjects, dbServices] = await Promise.all([
    getFeaturedProjects(),
    getServices(),
  ]);

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <SocialProof />
        <Services services={dbServices} />
        <WorksShowcase projects={featuredProjects} />
        <Features />
        <PrismHighlight />
        <AgenticProtocol />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
