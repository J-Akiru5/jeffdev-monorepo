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

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <HeroSection />
        <SocialProof />
        <Services />
        <WorksShowcase />
        <Features />
        <PrismHighlight />
        <AgenticProtocol />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
