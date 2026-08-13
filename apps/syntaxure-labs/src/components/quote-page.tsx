"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Globe,
  Box,
  Cpu,
  Cloud,
  Sparkles,
  Palette,
  Layers,
  Wrench,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@syntaxure/ui";

interface QuotePageProps {
  preselectedService: string | null;
  pageContent?: {
    successMessage?: string;
  };
  defaults: {
    successMessage: string;
  };
}

interface FormData {
  // Step 1: Project Type (only if not preselected)
  projectType: string;
  projectTypeLabel: string;

  // Step 2 (or 1 if preselected): Project Scope
  projectScope: string;
  budgetRange: string;
  timeline: string;

  // Contact
  name: string;
  email: string;
  company: string;
  phone: string;
  requirements: string;
}

const serviceOptions = [
  {
    slug: "web-development",
    label: "Website / Web App",
    description: "Custom websites, landing pages, web applications, and portals",
    icon: Globe,
  },
  {
    slug: "saas-platforms",
    label: "SaaS Platform",
    description: "Multi-tenant SaaS products, subscription platforms, dashboards",
    icon: Box,
  },
  {
    slug: "ai-integration",
    label: "AI / Automation",
    description: "AI integrations, chatbots, workflow automation, RAG pipelines",
    icon: Cpu,
  },
  {
    slug: "cloud-architecture",
    label: "Cloud Infrastructure",
    description: "Cloud migration, DevOps setup, scalable hosting architecture",
    icon: Cloud,
  },
  {
    slug: "other",
    label: "Not Sure / Other",
    description: "Tell us what you need and we'll figure out the best approach",
    icon: Sparkles,
  },
];

const scopeOptions = [
  {
    id: "template",
    label: "MVP / Initial Launch",
    description: "Build a core, functioning version of your product to launch quickly.",
    icon: Layers,
  },
  {
    id: "full",
    label: "100% Custom Build",
    description: "A completely custom solution designed and built from scratch for your specific needs.",
    icon: Wrench,
  },
  {
    id: "redesign",
    label: "Redesign / Revamp",
    description: "Modernize and upgrade your existing website or application.",
    icon: Palette,
  },
  {
    id: "features",
    label: "Add New Features",
    description: "Integrate new capabilities or tools into your current setup.",
    icon: Sparkles,
  },
];

const budgetRanges = [
  { id: "50-100k", php: 50000, phpMax: 100000 },
  { id: "100-250k", php: 100000, phpMax: 250000 },
  { id: "250-500k", php: 250000, phpMax: 500000 },
  { id: "500k-plus", php: 500000, phpMax: null },
  { id: "not-sure", php: 0, phpMax: null },
];

function formatBudgetLabel(id: string, currency: string, rate: number): string {
  if (id === "not-sure") return "Not sure yet";
  const range = budgetRanges.find((r) => r.id === id);
  if (!range) return id;
  if (currency === "PHP") {
    const min = range.php / 1000;
    if (range.phpMax) return `₱${min}K - ₱${range.phpMax / 1000}K`;
    return `₱${min}K+`;
  }
  const usdMin = Math.round(range.php / 1000 / rate * 1000);
  const usdMinK = Math.round(usdMin / 1000);
  if (range.phpMax) {
    const usdMax = Math.round(range.phpMax / 1000 / rate * 1000);
    const usdMaxK = Math.round(usdMax / 1000);
    return `~$${usdMinK}K - ~$${usdMaxK}K`;
  }
  return `~$${usdMinK}K+`;
}

const timelineOptions = [
  { id: "asap", label: "ASAP (1-2 weeks)", icon: Clock },
  { id: "1-3months", label: "1-3 months", icon: TrendingUp },
  { id: "3-6months", label: "3-6 months", icon: TrendingUp },
  { id: "flexible", label: "Flexible", icon: Clock },
];

const serviceLabels: Record<string, string> = {
  "web-development": "Website / Web App",
  "saas-platforms": "SaaS Platform",
  "ai-integration": "AI / Automation",
  "cloud-architecture": "Cloud Infrastructure",
  other: "Not Sure / Other",
};

export function QuotePageClient({
  preselectedService,
  pageContent,
  defaults,
}: QuotePageProps) {
  const { currency, exchangeRate } = useCurrency();

  // If service is preselected, start at step 1 (scope)
  const totalSteps = preselectedService ? 3 : 4;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    projectType: preselectedService || "",
    projectTypeLabel: preselectedService
      ? serviceLabels[preselectedService] || ""
      : "",
    projectScope: "",
    budgetRange: "",
    timeline: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    requirements: "",
  });



  const updateData = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (!preselectedService && step === 1) return data.projectType !== "";
    if (
      (preselectedService && step === 1) ||
      (!preselectedService && step === 2)
    )
      return data.projectScope !== "";
    if (
      (preselectedService && step === 2) ||
      (!preselectedService && step === 3)
    )
      return (
        data.name !== "" && data.email !== "" && data.requirements.length >= 20
      );
    // Review step: always can proceed (just needs to click submit)
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const { submitQuoteForm } = await import("@/app/actions/quote");
    const result = await submitQuoteForm({
      projectType: data.projectType,
      projectTypeLabel: data.projectTypeLabel,
      projectScope: data.projectScope as "template" | "redesign" | "features" | "full",
      budgetRange: data.budgetRange,
      timeline: data.timeline,
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      requirements: data.requirements,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Quote Request Sent!
            </h1>
            <p className="mt-4 text-[var(--text-secondary)]">
              {pageContent?.successMessage || defaults.successMessage}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 text-cyan-500 dark:text-cyan-400 transition-colors hover:text-cyan-400"
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
        <section className="px-6 py-8 lg:py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Progress Stepper */}
            <div className="mb-8">
              <div className="flex w-full items-center">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
                  (s) => (
                    <div key={s} className={cn("flex items-center", s < totalSteps && "flex-1")}>
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm transition-all",
                          step >= s
                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400"
                            : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]",
                        )}
                      >
                        {step > s ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          s
                        )}
                      </div>
                      {s < totalSteps && (
                        <div
                          className={cn(
                            "mx-4 h-px flex-1",
                            step > s
                              ? "bg-cyan-500/50"
                              : "bg-[var(--border-subtle)]",
                          )}
                        />
                      )}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <span key={i}>{getLabelForIndex(i, preselectedService)}</span>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Project Type (only if no preselected service) */}
            {!preselectedService && step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  What do you need built?
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Select the type of project you have in mind.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceOptions.map((svc) => {
                    const Icon = svc.icon;
                    return (
                      <button
                        key={svc.slug}
                        onClick={() => {
                          updateData("projectType", svc.slug);
                          updateData("projectTypeLabel", svc.label);
                        }}
                        className={cn(
                          "rounded-md border p-5 text-left transition-all",
                          data.projectType === svc.slug
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                            <Icon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">
                              {svc.label}
                            </div>
                            <div className="mt-0.5 text-sm text-[var(--text-secondary)]">
                              {svc.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step: Scope (step 1 if preselected, step 2 if not) */}
            {((preselectedService && step === 1) ||
              (!preselectedService && step === 2)) && (
              <div>
                <div className="mb-6">
                  {preselectedService && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-sm text-cyan-500 dark:text-cyan-400">
                      <Check className="h-3.5 w-3.5" />
                      Service:{" "}
                      {serviceLabels[preselectedService] || preselectedService}
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Project Scope
                  </h1>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    What kind of work does your project need?
                  </p>
                </div>

                {/* Scope Type */}
                <div>
                  <label className="mb-3 block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                    Scope Type
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {scopeOptions.map((scope) => {
                    const Icon = scope.icon;
                    return (
                      <button
                        key={scope.id}
                        onClick={() =>
                          updateData("projectScope", scope.id)
                        }
                        className={cn(
                          "w-full rounded-md border p-5 text-left transition-all",
                          data.projectScope === scope.id
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                            <Icon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">
                              {scope.label}
                            </div>
                            <div className="mt-0.5 text-sm text-[var(--text-secondary)]">
                              {scope.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>

                {/* Budget (optional) */}
                <div className="mt-8">
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                    Budget Range (optional)
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {budgetRanges.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => updateData("budgetRange", data.budgetRange === b.id ? "" : b.id)}
                        className={cn(
                          "rounded-md border px-3 py-2.5 text-center text-sm transition-all",
                          data.budgetRange === b.id
                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400"
                            : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]",
                        )}
                      >
                        {formatBudgetLabel(b.id, currency, exchangeRate)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-8">
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                    Desired Timeline
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {timelineOptions.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => updateData("timeline", t.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-all",
                            data.timeline === t.id
                              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400"
                              : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Contact & Requirements */}
            {((preselectedService && step === 2) ||
              (!preselectedService && step === 3)) && (
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  Contact & Requirements
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Tell us about yourself and describe your project in detail.
                </p>

                <div className="mt-8 space-y-6">
                  {/* Preselected service summary */}
                  {preselectedService && (
                    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-[var(--text-secondary)]">
                          Service:{" "}
                          <span className="font-semibold text-[var(--text-primary)]">
                            {serviceLabels[preselectedService] ||
                              preselectedService}
                          </span>
                        </span>
                        <span className="text-[var(--text-tertiary)]">|</span>
                        <span className="text-[var(--text-secondary)]">
                          Scope:{" "}
                          <span className="font-semibold text-[var(--text-primary)]">
                            {scopeOptions.find(
                              (s) => s.id === data.projectScope,
                            )?.label || data.projectScope}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => updateData("name", e.target.value)}
                        className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-cyan-500/50 focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Company
                      </label>
                      <input
                        type="text"
                        value={data.company}
                        onChange={(e) => updateData("company", e.target.value)}
                        className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-cyan-500/50 focus:outline-none"
                        placeholder="Company name (optional)"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => updateData("email", e.target.value)}
                        className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-cyan-500/50 focus:outline-none"
                        placeholder="you@company.com"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={data.phone}
                        onChange={(e) => updateData("phone", e.target.value)}
                        className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-cyan-500/50 focus:outline-none"
                        placeholder="+63 xxx xxx xxxx (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                      Project Details *{" "}
                      <span className="text-[var(--text-tertiary)] opacity-60">
                        (min 20 chars)
                      </span>
                    </label>
                    <textarea
                      value={data.requirements}
                      onChange={(e) => updateData("requirements", e.target.value)}
                      rows={5}
                      className="mt-2 w-full resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-cyan-500/50 focus:outline-none"
                      placeholder="Describe your project: goals, features, must-haves, and any references or examples..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step: Review & Confirm (last step) */}
            {((preselectedService && step === 3) ||
              (!preselectedService && step === 4)) && (
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  Review Your Request
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Please review your information before submitting.
                </p>

                <div className="mt-8 space-y-4">
                  {/* Service Type */}
                  <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          Project Type
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text-primary)]">
                          {data.projectTypeLabel || (preselectedService ? serviceLabels[preselectedService] : "")}
                        </div>
                      </div>
                      <button
                        onClick={() => setStep(preselectedService ? 1 : 1)}
                        className="text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Scope */}
                  <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          Scope
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text-primary)]">
                          {scopeOptions.find((s) => s.id === data.projectScope)?.label || data.projectScope}
                        </div>
                      </div>
                      <button
                        onClick={() => setStep(preselectedService ? 1 : 2)}
                        className="text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Budget (if selected) */}
                  {data.budgetRange && data.budgetRange !== "" && (
                    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                            Budget Range
                          </div>
                          <div className="mt-1 font-semibold text-[var(--text-primary)]">
                            {formatBudgetLabel(data.budgetRange, currency, exchangeRate)}
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(preselectedService ? 1 : 2)}
                          className="text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {data.timeline && data.timeline !== "" && (
                    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                            Timeline
                          </div>
                          <div className="mt-1 font-semibold text-[var(--text-primary)]">
                            {timelineOptions.find((t) => t.id === data.timeline)?.label || data.timeline}
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(preselectedService ? 1 : 2)}
                          className="text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          Contact
                        </div>
                        <div className="mt-1 text-[var(--text-primary)]">
                          {data.name} — {data.email}
                        </div>
                        {data.company && (
                          <div className="text-sm text-[var(--text-secondary)]">
                            {data.company}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setStep(preselectedService ? 2 : 3)}
                        className="text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Link>
              )}

              {step < totalSteps ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all",
                    canProceed()
                      ? "border-cyan-500/50 bg-cyan-500/10 text-[var(--text-primary)] hover:border-cyan-400 hover:bg-cyan-500/20"
                      : "cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-tertiary)]",
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
                    "flex items-center gap-2 rounded-md border px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all",
                    canProceed() && !isSubmitting
                      ? "border-cyan-500/50 bg-cyan-500/10 text-[var(--text-primary)] hover:border-cyan-400 hover:bg-cyan-500/20"
                      : "cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-tertiary)]",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit_Quote"
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

/** Helper to get the label for a step index */
function getLabelForIndex(
  index: number,
  preselectedService: string | null,
): string {
  if (!preselectedService) {
    const labels = ["Project", "Scope", "Contact", "Review"];
    return labels[index] || "";
  }
  const labels = ["Scope", "Contact", "Review"];
  return labels[index] || "";
}
