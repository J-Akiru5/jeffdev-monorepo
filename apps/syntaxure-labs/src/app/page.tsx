import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { Services } from '@/components/sections/services';
import { Features } from '@/components/sections/features';
import { WorksShowcase } from '@/components/sections/works-showcase';
import { CTA } from '@/components/sections/cta';
import { AgenticProtocol } from '@/components/sections/agentic-protocol';

/**
 * Homepage
 * --------
 * Syntaxure Labs landing page featuring:
 * - Hero section with GSAP reveal + glass-neon blend
 * - Services grid (productized offerings)
 * - Features grid (why choose us)
 * - Works showcase (featured project carousel)
 * - Agentic Protocol manifesto
 * - CTA banner with availability indicator
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Features />
        <WorksShowcase />
        <AgenticProtocol />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
