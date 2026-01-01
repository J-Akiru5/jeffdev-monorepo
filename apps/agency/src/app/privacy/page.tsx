import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How JeffDev Studio collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              Last updated: December 2025
            </p>

            <div className="prose prose-invert mt-12 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-white/60 prose-strong:text-white prose-li:text-white/60">
              <h2>1. Introduction</h2>
              <p>
                JeffDev Studio (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website jeffdev.studio (the &ldquo;Site&rdquo;).
              </p>

              <h2>2. Information We Collect</h2>
              <h3>a. Personal Data</h3>
              <p>
                We may collect personal information that you voluntarily provide to us when you fill out a contact form, request a quote, or subscribe to our newsletter. This includes:
              </p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Company name</li>
                <li>Project details</li>
              </ul>

              <h3>b. Usage Data</h3>
              <p>
                We automatically collect certain information when you visit, using cookies and similar tracking technologies. This includes:
              </p>
              <ul>
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent</li>
                <li>Referring website</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the collected data for the following purposes:</p>
              <ul>
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>

              <h2>4. Cookies</h2>
              <p>
                We use cookies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
              <p>
                For more details, please see our{' '}
                <Link href="/cookies" className="text-cyan-400">
                  Cookie Policy
                </Link>
                .
              </p>

              <h2>5. Data Security</h2>
              <p>
                The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>

              <h2>6. Third-Party Services</h2>
              <p>
                We may employ third-party companies and individuals to facilitate our Service (&ldquo;Service Providers&rdquo;), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
              </p>
              <ul>
                <li><strong>Google Analytics:</strong> We use Google Analytics to monitor and analyze the use of our Service.</li>
                <li><strong>Vercel Analytics:</strong> We use Vercel Analytics to measure performance and web vitals.</li>
              </ul>

              <h2>7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
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
