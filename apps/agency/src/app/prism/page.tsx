'use client';

/**
 * Prism Engine - Coming Soon Page
 * ---------------------------------
 * Cryptic teaser with 3D rotating prism.
 * "Something is forming..."
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { joinWaitlist } from '@/app/actions/waitlist';
import { cn } from '@/lib/utils';
import { Prism3D } from '@/components/prism/prism-3d';

export default function PrismPage() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMessage('');

    startTransition(async () => {
      // Role is optional/omitted for mystery
      const result = await joinWaitlist({ email });
      if (result.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Something went wrong');
      }
    });
  };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6 py-24 lg:px-8">
          {/* Background Effects (Darker, more mysterious) */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[120px] animate-pulse-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_80%)]" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center w-full">
            <div className="mb-12">
               <Prism3D className="mx-auto scale-125 hover:scale-150 transition-transform duration-1000" />
            </div>

            {/* Cryptic Title */}
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-white md:text-6xl font-sans">
              Something is forming...
            </h1>

            {/* Cryptic Subtitle */}
            <p className="mt-4 text-xl text-white/30 md:text-2xl font-mono tracking-widest uppercase">
              A new paradigm. 2026.
            </p>

            {/* Waitlist Form - Minimalist */}
            <div className="mx-auto mt-16 max-w-sm">
              {status === 'success' ? (
                <div className="animate-in fade-in zoom-in duration-500 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6 text-center backdrop-blur-sm">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-white/60">
                    Transmission received. We will signal you.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter signal frequency (email)"
                      required
                      className="w-full rounded-full border border-white/5 bg-white/[0.03] px-6 py-4 text-center text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono text-sm"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl opacity-0 transition-opacity group-hover:opacity-100 rounded-full" />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                      'w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white hover:border-white/20',
                      isPending && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Establishing Link...
                      </span>
                    ) : (
                      'Request Access'
                    )}
                  </button>
                </form>
              )}
              
              <div className="mt-12">
                 <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs text-white/20 transition-colors hover:text-white/40 font-mono uppercase tracking-widest"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Abort
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
