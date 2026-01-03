import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/layout/public-nav';
import { AnimatedHero } from '@/components/hero';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <PublicNav />

      {/* Animated Hero Section with ScrollTrigger Pinning */}
      <AnimatedHero />

      {/* Footer */}
      <footer className="border-t border-white/5 relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/prism-icon.png"
                  alt="Prism Context Engine"
                  width={24}
                  height={24}
                />
                <span className="text-gradient-cyan font-bold">Prism Context Engine</span>
              </div>
              <p className="text-white/40 text-sm">
                The Context Operating System for developers who ship fast.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="https://docs.jeffdev.studio" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="https://jeffdev.studio" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    About JD Studio
                  </Link>
                </li>
                <li>
                  <Link href="https://jeffdev.studio/contact" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Get Started</h3>
              <p className="text-white/60 text-sm mb-4">
                Ready to eliminate context pollution?
              </p>
              <Link
                href="/sign-up"
                className="inline-block glass px-6 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-white"
              >
                Start Free →
              </Link>
            </div>
          </div>

          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/30 text-xs font-mono">
              © {new Date().getFullYear()} JD Studio. Built with Prism Context Engine.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/terms" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
