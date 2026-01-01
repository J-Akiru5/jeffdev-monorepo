'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PriceRangeDisplay } from '@/components/ui/price-display';
import { cn } from '@/lib/utils';

/**
 * Multi-Step Quote Form
 * ---------------------
 * Step 1: Project Type
 * Step 2: Budget & Timeline
 * Step 3: Contact Info
 *
 * Budget ranges use CurrencyContext for automatic localization.
 */

const projectTypes = [
  { id: 'web', label: 'Web Application', description: 'Marketing sites, portals, dashboards' },
  { id: 'saas', label: 'SaaS Platform', description: 'Multi-tenant, subscription-based' },
  { id: 'mobile', label: 'Mobile App', description: 'iOS, Android, or cross-platform' },
  { id: 'ai', label: 'AI Integration', description: 'Chatbots, automation, ML features' },
  { id: 'other', label: 'Other', description: 'Custom project or consultation' },
];

/**
 * Budget ranges stored as PHP numeric values for currency conversion
 */
const budgetRanges = [
  { id: '50k-100k', minPhp: 50000, maxPhp: 100000, description: 'Small projects, MVPs' },
  { id: '100k-250k', minPhp: 100000, maxPhp: 250000, description: 'Medium complexity apps' },
  { id: '250k-500k', minPhp: 250000, maxPhp: 500000, description: 'Full-featured platforms' },
  { id: '500k+', minPhp: 500000, maxPhp: null, description: 'Enterprise solutions' },
];

const timelines = [
  { id: '1-2-weeks', label: '1-2 Weeks', description: 'Rush / Small scope' },
  { id: '1-month', label: '1 Month', description: 'Standard project' },
  { id: '2-3-months', label: '2-3 Months', description: 'Complex platform' },
  { id: 'flexible', label: 'Flexible', description: 'No strict deadline' },
];

interface FormData {
  projectType: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  company: string;
  details: string;
}

export default function QuotePage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    projectType: '',
    budget: '',
    timeline: '',
    name: '',
    email: '',
    company: '',
    details: '',
  });

  const updateData = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return data.projectType !== '';
    if (step === 2) return data.budget !== '' && data.timeline !== '';
    if (step === 3) return data.name !== '' && data.email !== '' && data.details.length >= 20;
    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const { submitQuoteForm } = await import('@/app/actions/quote');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await submitQuoteForm(data as any);

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.message);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center px-6 pt-24">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Quote Request Sent!</h1>
            <p className="mt-4 text-white/60">
              Thank you for your interest. We&apos;ll review your project details and
              get back to you within 24 hours with a custom quote.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 text-cyan-400 transition-colors hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {/* Progress */}
            <div className="mb-12">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm transition-all',
                        step >= s
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                          : 'border-white/10 bg-white/5 text-white/40'
                      )}
                    >
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={cn(
                          'mx-4 h-px w-16 sm:w-24',
                          step > s ? 'bg-cyan-500/50' : 'bg-white/10'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
                <span>Project</span>
                <span>Budget</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Project Type */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-white">
                  What type of project?
                </h1>
                <p className="mt-2 text-white/50">
                  Select the option that best describes your project.
                </p>
                <div className="mt-8 space-y-3">
                  {projectTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => updateData('projectType', type.id)}
                      className={cn(
                        'w-full rounded-md border p-4 text-left transition-all',
                        data.projectType === type.id
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'border-white/10 bg-white/2 hover:border-white/20'
                      )}
                    >
                      <div className="font-semibold text-white">{type.label}</div>
                      <div className="mt-0.5 text-sm text-white/50">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Budget & Timeline */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Budget & Timeline
                </h1>
                <p className="mt-2 text-white/50">
                  Help us understand your constraints.
                </p>

                <div className="mt-8">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                    Investment Range
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {budgetRanges.map((range) => (
                      <button
                        key={range.id}
                        onClick={() => updateData('budget', range.id)}
                        className={cn(
                          'rounded-md border p-4 text-left transition-all',
                          data.budget === range.id
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : 'border-white/10 bg-white/2 hover:border-white/20'
                        )}
                      >
                        <div className="font-semibold text-white">
                          <PriceRangeDisplay minPhp={range.minPhp} maxPhp={range.maxPhp} />
                        </div>
                        <div className="mt-0.5 text-sm text-white/50">
                          {range.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                    Timeline
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {timelines.map((tl) => (
                      <button
                        key={tl.id}
                        onClick={() => updateData('timeline', tl.id)}
                        className={cn(
                          'rounded-md border p-4 text-left transition-all',
                          data.timeline === tl.id
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : 'border-white/10 bg-white/2 hover:border-white/20'
                        )}
                      >
                        <div className="font-semibold text-white">{tl.label}</div>
                        <div className="mt-0.5 text-sm text-white/50">
                          {tl.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact Info */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Your Contact Info
                </h1>
                <p className="mt-2 text-white/50">
                  Tell us about yourself and your project.
                </p>

                <div className="mt-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => updateData('name', e.target.value)}
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                        Company
                      </label>
                      <input
                        type="text"
                        value={data.company}
                        onChange={(e) => updateData('company', e.target.value)}
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                        placeholder="Company name (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData('email', e.target.value)}
                      className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                      Project Details * <span className="text-white/20">(min 20 chars)</span>
                    </label>
                    <textarea
                      value={data.details}
                      onChange={(e) => updateData('details', e.target.value)}
                      rows={5}
                      className="mt-2 w-full resize-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                      placeholder="Describe your project, goals, and any specific requirements..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 text-white/50 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-2 text-white/50 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Link>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all',
                    canProceed()
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-white hover:border-cyan-400 hover:bg-cyan-500/20'
                      : 'cursor-not-allowed border-white/10 text-white/30'
                  )}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all',
                    canProceed() && !isSubmitting
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-white hover:border-cyan-400 hover:bg-cyan-500/20'
                      : 'cursor-not-allowed border-white/10 text-white/30'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit_Quote'
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
