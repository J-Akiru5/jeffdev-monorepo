"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Package, Palette, Code, Layers, Wrench } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@syntaxure/ui";

interface ProductTemplate {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  short_description: string | null;
  icon: string | null;
  base_price_monthly_php: number | null;
  base_price_monthly_usd: number | null;
  features: unknown[];
  tech_stack: string[];
}

interface QuotePageProps {
  templates: ProductTemplate[];
  pageContent?: {
    successMessage?: string;
  };
  defaults: {
    successMessage: string;
  };
}

interface FormData {
  templateSelected: string;
  templateName: string;
  customizationScope: "brand" | "api" | "features" | "full" | "";
  name: string;
  email: string;
  company: string;
  phone: string;
  requirements: string;
}

const scopeOptions = [
  {
    id: "brand",
    label: "Basic Brand/UI Tweaks",
    description: "Colors, fonts, logos, and basic styling changes",
    icon: Palette,
  },
  {
    id: "api",
    label: "Custom API Integrations",
    description: "Connect third-party services, webhooks, and data pipelines",
    icon: Code,
  },
  {
    id: "features",
    label: "New Features on Top",
    description: "Build additional functionality on the base template",
    icon: Layers,
  },
  {
    id: "full",
    label: "Full Custom Build",
    description: "Complete customization with new pages, flows, and integrations",
    icon: Wrench,
  },
];

export function QuotePageClient({ templates, pageContent, defaults }: QuotePageProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    templateSelected: "",
    templateName: "",
    customizationScope: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    requirements: "",
  });

  const updateData = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const selectTemplate = (slug: string, name: string) => {
    setData((prev) => ({ ...prev, templateSelected: slug, templateName: name }));
  };

  const canProceed = () => {
    if (step === 1) return data.templateSelected !== "";
    if (step === 2) return data.customizationScope !== "";
    if (step === 3)
      return data.name !== "" && data.email !== "" && data.requirements.length >= 20;
    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const { submitQuoteForm } = await import("@/app/actions/quote");
    const result = await submitQuoteForm({
      templateSelected: data.templateSelected,
      templateName: data.templateName,
      customizationScope: data.customizationScope,
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
            <h1 className="text-3xl font-bold text-white">
              Quote Request Sent!
            </h1>
            <p className="mt-4 text-white/60">
              {pageContent?.successMessage || defaults.successMessage}
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
          <div className="mx-auto max-w-3xl">
            {/* Progress */}
            <div className="mb-12">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm transition-all",
                        step >= s
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-white/10 bg-white/5 text-white/40",
                      )}
                    >
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={cn(
                          "mx-4 h-px w-16 sm:w-24",
                          step > s ? "bg-cyan-500/50" : "bg-white/10",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
                <span>Template</span>
                <span>Scope</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Template Selection */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Select Your Base Template
                </h1>
                <p className="mt-2 text-white/50">
                  Choose the SaaS template that closest matches your vision. We&apos;ll customize it from there.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.slug, template.name)}
                      className={cn(
                        "rounded-md border p-5 text-left transition-all",
                        data.templateSelected === template.slug
                          ? "border-cyan-500/50 bg-cyan-500/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                          <Package className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white">
                            {template.name}
                          </div>
                          <div className="mt-0.5 text-sm text-white/50 line-clamp-2">
                            {template.tagline || template.short_description || "SaaS template"}
                          </div>
                          {template.base_price_monthly_php && (
                            <div className="mt-2 font-mono text-xs text-cyan-400">
                              ₱{template.base_price_monthly_php.toLocaleString()}/mo base
                            </div>
                          )}
                          {template.tech_stack && template.tech_stack.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.tech_stack.slice(0, 4).map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Custom option */}
                  <button
                    onClick={() => selectTemplate("custom", "Custom / Other")}
                    className={cn(
                      "rounded-md border p-5 text-left transition-all",
                      data.templateSelected === "custom"
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                        <Wrench className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          Custom / Other
                        </div>
                        <div className="mt-0.5 text-sm text-white/50">
                          Don&apos;t see your template? Describe what you need.
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customization Scope */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Customization Scope
                </h1>
                <p className="mt-2 text-white/50">
                  What level of customization do you need for{" "}
                  <span className="text-cyan-400">{data.templateName}</span>?
                </p>
                <div className="mt-8 space-y-3">
                  {scopeOptions.map((scope) => {
                    const Icon = scope.icon;
                    return (
                      <button
                        key={scope.id}
                        onClick={() => updateData("customizationScope", scope.id)}
                        className={cn(
                          "w-full rounded-md border p-5 text-left transition-all",
                          data.customizationScope === scope.id
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                            <Icon className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {scope.label}
                            </div>
                            <div className="mt-0.5 text-sm text-white/50">
                              {scope.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Contact Info & Requirements */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Contact & Requirements
                </h1>
                <p className="mt-2 text-white/50">
                  Tell us about yourself and your specific customization requirements.
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
                        onChange={(e) => updateData("name", e.target.value)}
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
                        onChange={(e) => updateData("company", e.target.value)}
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                        placeholder="Company name (optional)"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => updateData("email", e.target.value)}
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                        placeholder="you@company.com"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={data.phone}
                        onChange={(e) => updateData("phone", e.target.value)}
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                        placeholder="+63 xxx xxx xxxx (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                      Specific Customization Requirements *{" "}
                      <span className="text-white/20">(min 20 chars)</span>
                    </label>
                    <textarea
                      value={data.requirements}
                      onChange={(e) => updateData("requirements", e.target.value)}
                      rows={5}
                      className="mt-2 w-full resize-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                      placeholder="Describe what you need customized: specific pages, integrations, branding changes, new features..."
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
                    "flex items-center gap-2 rounded-md border px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all",
                    canProceed()
                      ? "border-cyan-500/50 bg-cyan-500/10 text-white hover:border-cyan-400 hover:bg-cyan-500/20"
                      : "cursor-not-allowed border-white/10 text-white/30",
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
                      ? "border-cyan-500/50 bg-cyan-500/10 text-white hover:border-cyan-400 hover:bg-cyan-500/20"
                      : "cursor-not-allowed border-white/10 text-white/30",
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
