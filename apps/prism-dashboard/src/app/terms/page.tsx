import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/layout/public-nav';

export const metadata = {
  title: 'Terms of Service | Prism Context Engine',
  description: 'Terms of Service for Prism Context Engine - the context governance platform for developers.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <PublicNav />

      {/* Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505]" />

      {/* Content */}
      <article className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-white/40 font-mono text-sm">
              Last updated: January 2026
            </p>
          </header>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            {/* Section 1 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">1. Services</h2>
              <p className="text-white/70 leading-relaxed">
                Prism Context Engine, operated by JeffDev Web Development Services (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), 
                is a SaaS platform that provides context governance for AI coding assistants. Our services include:
              </p>
              <ul className="list-disc list-inside text-white/70 mt-4 space-y-2">
                <li>MCP (Model Context Protocol) Server deployment</li>
                <li>Video-to-context processing and transcription</li>
                <li>AI-powered architectural rule extraction</li>
                <li>Component library management</li>
                <li>IDE integration and synchronization</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">2. Subscription Tiers</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                We offer four subscription tiers: Free, Pro, Team, and Enterprise. Each tier has specific 
                usage limits as described on our <Link href="/pricing" className="text-cyan-400 hover:underline">pricing page</Link>.
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li><strong className="text-white">Free:</strong> Limited features for evaluation purposes</li>
                <li><strong className="text-white">Pro:</strong> Individual developers with expanded limits</li>
                <li><strong className="text-white">Team:</strong> Collaborative teams with shared libraries</li>
                <li><strong className="text-white">Enterprise:</strong> Custom solutions with dedicated support</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">3. Payment Terms</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                All payments are processed securely through PayPal. By subscribing to a paid plan:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Monthly subscriptions are billed on the same date each month</li>
                <li>Annual subscriptions are billed upfront for the full year</li>
                <li>Upgrades take effect immediately; downgrades apply at the next billing cycle</li>
                <li>Prices are displayed in Philippine Pesos (₱) unless otherwise specified</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-4">
                We offer a 14-day money-back guarantee for annual subscriptions. Monthly subscriptions 
                can be cancelled anytime but are non-refundable for the current period.
              </p>
            </section>

            {/* Section 4 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">4. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Your Content</h3>
                  <p className="text-white/70 leading-relaxed">
                    You retain full ownership of all rules, components, and context data you create using 
                    Prism Context Engine. We do not claim ownership over your intellectual property.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Our Platform</h3>
                  <p className="text-white/70 leading-relaxed">
                    The Prism Context Engine platform, including its code, design, and features, remains 
                    the intellectual property of JeffDev Web Development Services.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Data Export</h3>
                  <p className="text-white/70 leading-relaxed">
                    You may export your rules and components at any time in standard formats (Markdown, JSON). 
                    We believe in no vendor lock-in—your data is yours.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">5. Data Processing</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                When you upload videos for context extraction:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Videos are processed using third-party AI services (OpenAI, Google Gemini)</li>
                <li>Transcripts and extracted rules are stored in your account</li>
                <li>We do not use your content to train public AI models without explicit consent</li>
                <li>Video files may be temporarily cached during processing and deleted within 24 hours</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">6. Usage Restrictions</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to reverse-engineer, decompile, or extract source code from our platform</li>
                <li>Share account credentials with unauthorized users</li>
                <li>Exceed your tier&apos;s usage limits through automated means</li>
                <li>Upload content that infringes on third-party intellectual property</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">7. Limitation of Liability</h2>
              <p className="text-white/70 leading-relaxed">
                We build systems to the best of our ability using industry-standard security practices. 
                However, we are not liable for:
              </p>
              <ul className="list-disc list-inside text-white/70 mt-4 space-y-2">
                <li>AI-generated content accuracy or fitness for purpose</li>
                <li>Third-party service outages (Clerk, Mux, OpenAI, Azure)</li>
                <li>Data loss due to user negligence or account compromise</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-4">
                <strong className="text-white">Maximum Liability:</strong> In any event, our liability is 
                strictly limited to the total amount paid by you in the 12 months preceding the claim.
              </p>
            </section>

            {/* Section 8 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">8. Termination</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">By You</h3>
                  <p className="text-white/70 leading-relaxed">
                    You may cancel your subscription at any time through your account settings. 
                    Access continues until the end of your current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">By Us</h3>
                  <p className="text-white/70 leading-relaxed">
                    We may terminate your account if you violate these terms, fail to pay, or engage in 
                    activities that harm our platform or other users.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Data Retention</h3>
                  <p className="text-white/70 leading-relaxed">
                    Upon cancellation, your data remains accessible in read-only mode for 30 days. 
                    After this period, data may be permanently deleted.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">9. Governing Law</h2>
              <p className="text-white/70 leading-relaxed">
                These terms are governed by the laws of the Republic of the Philippines. Any disputes 
                shall be resolved in the courts of Iloilo City.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
              <p className="text-white/70 leading-relaxed">
                For questions about these terms, contact us at{' '}
                <a href="mailto:legal@jeffdev.studio" className="text-cyan-400 hover:underline">
                  legal@jeffdev.studio
                </a>
              </p>
            </section>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image
                src="/prism-icon.png"
                alt="Prism Context Engine"
                width={24}
                height={24}
              />
              <span className="text-gradient-cyan font-bold">Prism Context Engine</span>
            </div>
            <div className="flex gap-6">
              <Link href="/terms" className="text-white/60 text-xs transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Privacy
              </Link>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-white/30 text-xs font-mono">
              © {new Date().getFullYear()} JD Studio. DTI: VLLP979818395984
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
