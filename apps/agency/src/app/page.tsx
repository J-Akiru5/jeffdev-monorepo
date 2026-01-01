import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { Services } from '@/components/sections/services';
import { CTA } from '@/components/sections/cta';

/**
 * Homepage
 * --------
 * JeffDev Agency landing page featuring:
 * - Hero section with GSAP reveal
 * - Services grid (productized offerings)
 * - CTA banner with availability indicator
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
