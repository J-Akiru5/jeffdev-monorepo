import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Detailed information about how JeffDev Studio uses cookies.',
};

export default function CookiePolicyPage() {
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
              Cookie Policy
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              Last updated: December 2025
            </p>

            <div className="prose prose-invert mt-12 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-white/60 prose-strong:text-white prose-li:text-white/60">
              <h2>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
              </p>

              <h2>2. How We Use Cookies</h2>
              <p>
                We use cookies to enhance the functionality of our website, analyze our traffic, and personalize content. We do not use cookies to collect sensitive personal information without your explicit consent.
              </p>

              <h2>3. Types of Cookies We Use</h2>
              <div className="not-prose mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Essential Cookies</h3>
                  <p className="mb-4 text-sm text-white/60">
                    These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-mono">Session ID</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-mono">Auth Token</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Analytics Cookies</h3>
                  <p className="mb-4 text-sm text-white/60">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-mono">_ga (Google Analytics)</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-mono">_vercel_insights</span>
                  </div>
                </div>
              </div>

              <h2>4. Managing Cookies</h2>
              <p>
                Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit{' '}
                <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400">
                  www.aboutcookies.org
                </a>{' '}
                or{' '}
                <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400">
                  www.allaboutcookies.org
                </a>
                .
              </p>
              <p>
                You can also change your preferences for this website specifically by using our cookie consent banner. If you rejected cookies initially, they are blocked. If you accepted, you can clear your browser cookies for this site to reset your choice.
              </p>

              <h2>5. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us at{' '}
                <a href="mailto:contact@jeffdev.studio" className="text-cyan-400">
                  contact@jeffdev.studio
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
