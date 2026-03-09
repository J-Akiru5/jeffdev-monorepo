'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Mail, MapPin, Send, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';

/**
 * Contact Page
 * ------------
 * Simple contact form with validation.
 * Form submits to Server Action (to be implemented).
 */

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    // Import the Server Action dynamically to avoid client-side bundle
    const { submitContactForm } = await import('@/app/actions/contact');
    const result = await submitContactForm(data);

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mt-8 grid gap-12 lg:grid-cols-2">
              {/* Left: Info */}
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                  {"// Contact"}
                </span>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                  Let&apos;s Talk
                </h1>
                <p className="mt-6 text-lg text-white/60">
                  Have a project in mind? We&apos;d love to hear about it. Send
                  us a message and we&apos;ll get back to you within 24 hours.
                </p>

                {/* Contact Info */}
                <div className="mt-10 space-y-4">
                  <a
                    href="mailto:hello@jeffdev.studio"
                    className="flex items-center gap-3 text-white/70 transition-colors hover:text-cyan-400"
                  >
                    <Mail className="h-5 w-5" />
                    hello@jeffdev.studio
                  </a>
                  <div className="flex items-center gap-3 text-white/50">
                    <MapPin className="h-5 w-5" />
                    Iloilo City, Philippines
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-10 border-t border-white/[0.06] pt-10">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                    Quick Actions
                  </h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <Link
                      href="/quote"
                      className="group inline-flex items-center gap-2 text-white/70 transition-colors hover:text-cyan-400"
                    >
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      Get a project quote
                    </Link>
                    <Link
                      href="/services"
                      className="group inline-flex items-center gap-2 text-white/70 transition-colors hover:text-cyan-400"
                    >
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      View our services
                    </Link>
                    <Link
                      href="/work"
                      className="group inline-flex items-center gap-2 text-white/70 transition-colors hover:text-cyan-400"
                    >
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      See case studies
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-8">
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 rounded-full bg-emerald-500/20 p-4">
                      <Send className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Message Sent!
                    </h3>
                    <p className="mt-2 text-white/50">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="mt-6 text-sm text-cyan-400 transition-colors hover:text-cyan-300"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                    <>
                      {error && (
                        <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 p-4">
                          <p className="text-sm text-red-400">{error}</p>
                        </div>
                      )}
                      <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block font-mono text-xs uppercase tracking-wider text-white/40"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        placeholder="Your name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block font-mono text-xs uppercase tracking-wider text-white/40"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        placeholder="you@company.com"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label
                        htmlFor="subject"
                        className="block font-mono text-xs uppercase tracking-wider text-white/40"
                      >
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        placeholder="Project inquiry"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block font-mono text-xs uppercase tracking-wider text-white/40"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        className="mt-2 w-full resize-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        placeholder="Tell us about your project..."
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        'group relative w-full overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-6 py-3.5 backdrop-blur-md transition-all',
                        'hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-wider text-white">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send_Message
                            <Send className="h-4 w-4" />
                          </>
                        )}
                      </span>
                    </button>
                      </form>
                    </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
