import Link from "next/link";
import Image from "next/image";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata = {
  title: "Privacy Policy | Prism Context Engine",
  description:
    "Privacy Policy for Prism Context Engine - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Privacy Policy
            </h1>
            <p className="text-[var(--text-tertiary)] font-mono text-sm">
              Last updated: May 2026
            </p>
          </header>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            {/* Section 1 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                1. Introduction
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Prism Context Engine, operated by Syntaxure Labs
                (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, and safeguard your information
                when you use our platform at prism.syntaxure.dev (the
                &quot;Service&quot;).
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                We adhere to the &quot;Data Sanctity&quot; principle from our
                constitution: we are guardians of your data and prioritize
                privacy-first processing.
              </p>
            </section>

            {/* Section 2 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                2. Information We Collect
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    a. Account Information
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    When you create an account through Supabase (our authentication
                    provider), we collect:
                  </p>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] mt-2 space-y-1">
                    <li>Email address</li>
                    <li>Name (if provided)</li>
                    <li>Profile picture (if using social login)</li>
                    <li>Account creation and login timestamps</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    b. Content You Create
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    When you use our Service, we store:
                  </p>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] mt-2 space-y-1">
                    <li>Architectural rules you define or AI generates</li>
                    <li>Component documentation and specifications</li>
                    <li>Project configurations and settings</li>
                    <li>Brand guidelines and design systems</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    d. Usage Data
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    We automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] mt-2 space-y-1">
                    <li>IP address and browser type</li>
                    <li>Pages visited and features used</li>
                    <li>AI generation usage counts</li>
                    <li>Error logs and performance metrics</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Provide and maintain the Service</li>
                <li>Process content and generate context rules</li>
                <li>Manage your subscription and billing</li>
                <li>Send important service notifications</li>
                <li>Improve our AI models and platform features</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                4. Third-Party Services
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                We use the following third-party services to provide our
                platform:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>
                  <strong className="text-[var(--text-primary)]">Supabase:</strong> Authentication
                  and user management
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">
                    Google Gemini / Azure OpenAI:
                  </strong>{" "}
                  AI-powered rule extraction
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Azure Cosmos DB:</strong> Data
                  storage
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">PayPal:</strong> Payment
                  processing (coming soon)
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Vercel:</strong> Platform
                  hosting and analytics
                </li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Each provider has their own privacy policies. We encourage you
                to review them.
              </p>
            </section>

            {/* Section 5 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                5. AI Training Policy
              </h2>
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                <p className="text-emerald-400 font-medium">
                  ✓ We do NOT use your content to train public AI models.
                </p>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Your rules, components, and video transcripts are your
                intellectual property. We may use aggregated, anonymized usage
                patterns to improve our platform, but your specific content is
                never used to train AI models without your explicit consent.
              </p>
            </section>

            {/* Section 6 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                6. Data Security
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>All data transmitted using TLS/HTTPS encryption</li>
                <li>Database encryption at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Strict access controls and authentication</li>
                <li>Secrets managed through Doppler (never stored in code)</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                While we strive to protect your data, no method of transmission
                over the Internet is 100% secure. We cannot guarantee absolute
                security.
              </p>
            </section>

            {/* Section 7 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                7. Data Retention
              </h2>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>
                  <strong className="text-[var(--text-primary)]">Active accounts:</strong> Data
                  retained for the duration of your subscription
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Cancelled accounts:</strong>{" "}
                  Read-only access for 30 days, then data may be deleted
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Video files:</strong> Deleted
                  within 24-48 hours after processing
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Audit logs:</strong> Retained
                  for 90 days for security purposes
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                8. Your Rights
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>
                  <strong className="text-[var(--text-primary)]">Access:</strong> Request a copy
                  of your personal data
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Export:</strong> Download your
                  rules and components in standard formats
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Correction:</strong> Update or
                  correct inaccurate information
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Deletion:</strong> Request
                  deletion of your account and data
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Portability:</strong> Transfer
                  your data to another service
                </li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@syntaxure.dev"
                  className="text-cyan-400 hover:underline"
                >
                  privacy@syntaxure.dev
                </a>
                .
              </p>
            </section>

            {/* Section 9 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">9. Cookies</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                We use essential cookies for authentication and session
                management. We also use analytics cookies (Vercel Analytics) to
                understand how our platform is used. You can configure your
                browser to refuse cookies, but some features may not work
                properly.
              </p>
            </section>

            {/* Section 10 */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                We may update this Privacy Policy periodically. We will notify
                you of significant changes via email or a prominent notice on
                our platform. Your continued use after changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Contact Us</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                For questions about this Privacy Policy or your data, contact us
                at:
              </p>
              <ul className="text-[var(--text-secondary)] mt-4 space-y-2">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:privacy@syntaxure.dev"
                    className="text-cyan-400 hover:underline"
                  >
                    privacy@syntaxure.dev
                  </a>
                </li>
                <li>
                  General inquiries:{" "}
                  <a
                    href="mailto:hello@syntaxure.dev"
                    className="text-cyan-400 hover:underline"
                  >
                    hello@syntaxure.dev
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image
                src="/prism-icon.png"
                alt="Prism Context Engine"
                width={24}
                height={24}
              />
              <span className="text-gradient-cyan font-bold">
                Prism Context Engine
              </span>
            </div>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-xs transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-[var(--text-secondary)] text-xs transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-[var(--text-tertiary)] text-xs font-mono">
              © {new Date().getFullYear()} Syntaxure Labs. DTI: VLLP979818395984
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

