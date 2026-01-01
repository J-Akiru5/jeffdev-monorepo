import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for JeffDev Web Development Services.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-white">
              Terms of Service
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              Last updated: December 2025
            </p>

            <div className="prose prose-invert mt-12 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-white/60 prose-strong:text-white prose-li:text-white/60">
              <h2>1. Services</h2>
              <p>
                JeffDev Web Development Services (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
                provides web development, software engineering, and related
                consulting services. All projects are governed by individual
                project agreements that specify scope, deliverables, timelines,
                and payment terms.
              </p>

              <h2>2. Project Agreements</h2>
              <p>
                Before commencing any project, both parties must agree to a
                written project proposal or contract that outlines:
              </p>
              <ul>
                <li>Scope of work and deliverables</li>
                <li>Project timeline and milestones</li>
                <li>Investment amount and payment schedule</li>
                <li>Revision and change request policies</li>
              </ul>

              <h2>3. Payment Terms</h2>
              <p>
                Unless otherwise specified in the project agreement:
              </p>
              <ul>
                <li>50% deposit required before project commencement</li>
                <li>Remaining balance due upon project completion</li>
                <li>Late payments may incur a 2% monthly fee</li>
              </ul>

              <h2>4. Intellectual Property</h2>
              <p>
                Upon full payment, the client receives full ownership of all
                custom code and assets created specifically for their project.
                We retain the right to use generic, reusable components and to
                showcase the project in our portfolio.
              </p>

              <h2>5. Confidentiality</h2>
              <p>
                We will not disclose any confidential information shared during
                the course of the project without written consent, except as
                required by law.
              </p>

              <h2>6. Limitation of Liability</h2>
              <p>
                Our liability is limited to the total amount paid for the
                project. We are not liable for indirect, incidental, or
                consequential damages arising from the use of deliverables.
              </p>

              <h2>7. Termination</h2>
              <p>
                Either party may terminate a project with 14 days written
                notice. Upon termination, the client shall pay for all work
                completed up to the termination date.
              </p>

              <h2>8. Governing Law</h2>
              <p>
                These terms are governed by the laws of the Republic of the
                Philippines. Any disputes shall be resolved in the courts of
                Iloilo City.
              </p>

              <h2>Contact</h2>
              <p>
                For questions about these terms, contact us at{' '}
                <a href="mailto:legal@jeffdev.studio" className="text-cyan-400">
                  legal@jeffdev.studio
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
