"use client";

import { useState, useActionState, Fragment } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { createBrand, type BrandFormState } from "../actions";
import { useActionFeedback } from "@/lib/hooks/use-action-feedback";

// Wizard steps
const STEPS = [
  { id: 1, name: "Identity", description: "Company basics" },
  { id: 2, name: "Colors", description: "Color palette" },
  { id: 3, name: "Typography", description: "Font choices" },
  { id: 4, name: "Voice", description: "Tone & personality" },
  { id: 5, name: "Review", description: "Confirm & create" },
];

// Font options (curated, non-generic)
const FONT_OPTIONS = [
  {
    value: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans",
    category: "Modern",
  },
  { value: "Outfit", label: "Outfit", category: "Geometric" },
  { value: "Satoshi", label: "Satoshi", category: "Neo-Grotesque" },
  { value: "Manrope", label: "Manrope", category: "Modern" },
  { value: "Space Grotesk", label: "Space Grotesk", category: "Display" },
  { value: "Sora", label: "Sora", category: "Technical" },
  { value: "DM Sans", label: "DM Sans", category: "Clean" },
  { value: "Inter", label: "Inter", category: "Neutral" },
];

/**
 * Multi-step Brand Wizard
 */
export default function NewBrandPage() {
  const [step, setStep] = useState(1);
  const [state, formAction, pending] = useActionState<BrandFormState, FormData>(
    createBrand,
    null,
  );
  useActionFeedback(state, { successMessage: "Brand created!" });

  // Form data stored in state for multi-step
  const [formData, setFormData] = useState({
    // Identity
    companyName: "",
    tagline: "",
    industry: "tech",
    // Colors
    colors: {
      primary: "#1A1A1A",
      secondary: "#2D2D2D",
      accent: "#06B6D4",
      background: "#050505",
      surface: "#0A0A0A",
      text: "#FAFAFA",
      textMuted: "#71717A",
    },
    // Typography
    typography: {
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Plus Jakarta Sans",
      monoFont: "JetBrains Mono",
      scale: "default" as const,
    },
    // Voice
    voice: {
      personality: "minimal" as const,
      formality: "balanced" as const,
      keywords: "",
    },
    // Imagery
    imagery: {
      style: "photography" as const,
      mood: "dark" as const,
    },
    // Spacing
    spacing: {
      unit: 4,
      borderRadius: "sm" as const,
    },
  });

  const updateFormData = (key: string, value: unknown) => {
    setFormData((prev) => {
      const keys = key.split(".");
      if (keys.length === 1) {
        return { ...prev, [key]: value };
      }
      // Nested update
      const parent = keys[0]!;
      const child = keys[1]!;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      };
    });
  };

  const [touched, setTouched] = useState(false);

  // Per-step required field validation
  const canProceed = (() => {
    if (step === 1) return formData.companyName.trim().length > 0;
    return true; // steps 2–4 have no hard requirements
  })();

  const nextStep = () => {
    if (!canProceed) { setTouched(true); return; }
    setTouched(false);
    setStep((s) => Math.min(s + 1, 5));
  };
  const prevStep = () => { setTouched(false); setStep((s) => Math.max(s - 1, 1)); };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back Link */}
      <Link
        href="/brand"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brands
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Create Brand Profile
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Define your brand identity to generate consistent Prism Rules.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center w-full">
        {STEPS.map((s, i) => (
          <Fragment key={s.id}>
            <div
              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step > s.id
                  ? "bg-blue-500 dark:bg-cyan-500 !text-white"
                  : step === s.id
                    ? "bg-blue-500/10 border border-blue-500/50 text-blue-600 dark:bg-cyan-500/20 dark:border-cyan-500/50 dark:text-cyan-400"
                    : "bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
              }`}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 mx-2 md:mx-4"
                style={{ height: "2px", backgroundColor: step > s.id ? "var(--color-cyan, #3b82f6)" : "var(--border-subtle, #cbd5e1)" }}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-[var(--text-primary)]">
          {STEPS[step - 1]!.name}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">{STEPS[step - 1]!.description}</p>
      </div>

      {/* Form */}
      <form action={formAction}>
        {/* Hidden fields for all form data */}
        <input type="hidden" name="companyName" value={formData.companyName} />
        <input type="hidden" name="tagline" value={formData.tagline} />
        <input type="hidden" name="industry" value={formData.industry} />
        <input
          type="hidden"
          name="colors.primary"
          value={formData.colors.primary}
        />
        <input
          type="hidden"
          name="colors.secondary"
          value={formData.colors.secondary}
        />
        <input
          type="hidden"
          name="colors.accent"
          value={formData.colors.accent}
        />
        <input
          type="hidden"
          name="colors.background"
          value={formData.colors.background}
        />
        <input
          type="hidden"
          name="colors.surface"
          value={formData.colors.surface}
        />
        <input type="hidden" name="colors.text" value={formData.colors.text} />
        <input
          type="hidden"
          name="colors.textMuted"
          value={formData.colors.textMuted}
        />
        <input
          type="hidden"
          name="typography.headingFont"
          value={formData.typography.headingFont}
        />
        <input
          type="hidden"
          name="typography.bodyFont"
          value={formData.typography.bodyFont}
        />
        <input
          type="hidden"
          name="typography.monoFont"
          value={formData.typography.monoFont}
        />
        <input
          type="hidden"
          name="typography.scale"
          value={formData.typography.scale}
        />
        <input
          type="hidden"
          name="voice.personality"
          value={formData.voice.personality}
        />
        <input
          type="hidden"
          name="voice.formality"
          value={formData.voice.formality}
        />
        <input
          type="hidden"
          name="voice.keywords"
          value={formData.voice.keywords}
        />
        <input
          type="hidden"
          name="imagery.style"
          value={formData.imagery.style}
        />
        <input
          type="hidden"
          name="imagery.mood"
          value={formData.imagery.mood}
        />
        <input
          type="hidden"
          name="spacing.unit"
          value={formData.spacing.unit}
        />
        <input
          type="hidden"
          name="spacing.borderRadius"
          value={formData.spacing.borderRadius}
        />

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <StepIdentity formData={formData} updateFormData={updateFormData} touched={touched} />
          )}
          {step === 2 && (
            <StepColors formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepTypography
              formData={formData}
              updateFormData={updateFormData}
              fontOptions={FONT_OPTIONS}
            />
          )}
          {step === 4 && (
            <StepVoice formData={formData} updateFormData={updateFormData} />
          )}
          {step === 5 && <StepReview formData={formData} />}
        </div>

        {/* Server errors shown inline — no alert box */}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed}
              title={!canProceed ? "Fill in all required fields to continue" : undefined}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium !text-white transition-colors bg-blue-600 dark:bg-cyan-500/10 border border-blue-600 dark:border-cyan-500/30 dark:text-cyan-400 ${
                canProceed
                  ? "hover:bg-blue-700 dark:hover:bg-cyan-500/20"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 dark:from-cyan-500 dark:to-violet-500 px-6 py-2 text-sm font-medium !text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {pending ? "Creating..." : "Create Brand"}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Step Components
function StepIdentity({
  formData,
  updateFormData,
  touched,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
  touched: boolean;
}) {
  const companyName = formData.companyName as string;
  const showCompanyError = touched && !companyName.trim();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => updateFormData("companyName", e.target.value)}
          placeholder="e.g. Keandrew Photography"
          className={`w-full rounded-md border px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-quiet)] focus:outline-none transition-colors ${
            showCompanyError
              ? "border-red-400 bg-red-50 dark:bg-red-500/5 focus:border-red-500"
              : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] focus:border-blue-500 dark:focus:border-cyan-500/50"
          }`}
        />
        {showCompanyError && (
          <p className="text-xs text-red-500 mt-1">Company name is required to continue.</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">Tagline</label>
        <input
          type="text"
          value={formData.tagline as string}
          onChange={(e) => updateFormData("tagline", e.target.value)}
          placeholder="Capturing Life's Authentic Moments"
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-quiet)] focus:border-blue-500 dark:focus:border-cyan-500/50 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Industry *
        </label>
        <select
          aria-label="Select industry"
          value={formData.industry as string}
          onChange={(e) => updateFormData("industry", e.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 dark:focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="photography">Photography</option>
          <option value="tech">Technology</option>
          <option value="agency">Agency</option>
          <option value="ecommerce">E-Commerce</option>
          <option value="saas">SaaS</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="education">Education</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );
}

function StepColors({
  formData,
  updateFormData,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  const colors = formData.colors as Record<string, string>;
  const c = (k: keyof typeof colors) => colors[k]!;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Define your brand&apos;s color palette
      </p>

      <div className="grid grid-cols-2 gap-4">
        <ColorPicker
          label="Primary"
          value={c("primary")}
          onChange={(v) => updateFormData("colors.primary", v)}
        />
        <ColorPicker
          label="Secondary"
          value={c("secondary")}
          onChange={(v) => updateFormData("colors.secondary", v)}
        />
        <ColorPicker
          label="Accent"
          value={c("accent")}
          onChange={(v) => updateFormData("colors.accent", v)}
        />
        <ColorPicker
          label="Background"
          value={c("background")}
          onChange={(v) => updateFormData("colors.background", v)}
        />
        <ColorPicker
          label="Surface"
          value={c("surface")}
          onChange={(v) => updateFormData("colors.surface", v)}
        />
        <ColorPicker
          label="Text"
          value={c("text")}
          onChange={(v) => updateFormData("colors.text", v)}
        />
        <ColorPicker
          label="Text Muted"
          value={c("textMuted")}
          onChange={(v) => updateFormData("colors.textMuted", v)}
        />
      </div>

      {/* Preview — intentionally uses inline styles to render the user's actual brand colors */}
      <div
        className="mt-6 rounded-md border border-[var(--border-subtle)] p-6"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="rounded-md p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 style={{ color: colors.text }} className="font-semibold">
            Preview
          </h3>
          <p style={{ color: colors.textMuted }} className="text-sm mt-1">
            This is how your colors look together.
          </p>
          <div className="flex gap-2 mt-4">
            <div
              className="px-4 py-2 rounded text-sm"
              style={{ backgroundColor: colors.primary, color: colors.text }}
            >
              Primary
            </div>
            <div
              className="px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: colors.accent,
                color: colors.background,
              }}
            >
              Accent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        aria-label={`${label} color picker`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-10 cursor-pointer rounded border border-[var(--border-subtle)] bg-transparent"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs text-[var(--text-tertiary)] font-mono focus:outline-none"
        />
      </div>
    </div>
  );
}

function StepTypography({
  formData,
  updateFormData,
  fontOptions,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
  fontOptions: { value: string; label: string; category: string }[];
}) {
  const typography = formData.typography as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Heading Font
        </label>
        <select
          aria-label="Heading font"
          value={typography.headingFont}
          onChange={(e) =>
            updateFormData("typography.headingFont", e.target.value)
          }
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 dark:focus:border-cyan-500/50 focus:outline-none"
        >
          {fontOptions.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label} ({f.category})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Body Font
        </label>
        <select
          aria-label="Body font"
          value={typography.bodyFont}
          onChange={(e) =>
            updateFormData("typography.bodyFont", e.target.value)
          }
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 dark:focus:border-cyan-500/50 focus:outline-none"
        >
          {fontOptions.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label} ({f.category})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Typography Scale
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["compact", "default", "spacious"].map((scale) => (
            <button
              key={scale}
              type="button"
              onClick={() => updateFormData("typography.scale", scale)}
              className={`rounded-md border px-4 py-3 text-sm capitalize transition-colors ${
                typography.scale === scale
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:border-cyan-500/50 dark:bg-cyan-500/10 dark:text-cyan-400"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:border-[var(--border-active)]"
              }`}
            >
              {scale}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepVoice({
  formData,
  updateFormData,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  const voice = formData.voice as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Brand Personality
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "minimal", label: "Minimal", desc: "Clean & understated" },
            { value: "warm", label: "Warm", desc: "Friendly & approachable" },
            { value: "bold", label: "Bold", desc: "Confident & impactful" },
            { value: "playful", label: "Playful", desc: "Fun & creative" },
            {
              value: "corporate",
              label: "Corporate",
              desc: "Professional & formal",
            },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => updateFormData("voice.personality", p.value)}
              className={`rounded-md border px-4 py-3 text-left transition-colors ${
                voice.personality === p.value
                  ? "border-blue-500/50 bg-blue-500/10 dark:border-cyan-500/50 dark:bg-cyan-500/10"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-active)]"
              }`}
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{p.label}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Formality Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["casual", "balanced", "formal"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => updateFormData("voice.formality", f)}
              className={`rounded-md border px-4 py-3 text-sm capitalize transition-colors ${
                voice.formality === f
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:border-cyan-500/50 dark:bg-cyan-500/10 dark:text-cyan-400"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:border-[var(--border-active)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Brand Keywords
        </label>
        <input
          type="text"
          value={voice.keywords}
          onChange={(e) => updateFormData("voice.keywords", e.target.value)}
          placeholder="authentic, timeless, elegant (comma-separated)"
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-quiet)] focus:border-blue-500 dark:focus:border-cyan-500/50 focus:outline-none"
        />
        <p className="text-xs text-[var(--text-quiet)]">
          Up to 10 keywords that define your brand
        </p>
      </div>
    </div>
  );
}

function StepReview({ formData }: { formData: Record<string, unknown> }) {
  const colors = formData.colors as Record<string, string>;
  const typography = formData.typography as Record<string, string>;
  const voice = formData.voice as Record<string, string>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-tertiary)]">
        Review your brand profile before creating
      </p>

      {/* Identity */}
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Identity</h3>
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          {formData.companyName as string}
        </p>
        {typeof formData.tagline === "string" && formData.tagline && (
          <p className="text-sm text-[var(--text-tertiary)]">{formData.tagline}</p>
        )}
        <span className="inline-block mt-2 text-xs text-blue-600 dark:text-cyan-400 capitalize">
          {formData.industry as string}
        </span>
      </div>

      {/* Colors Preview */}
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Colors</h3>
        <div className="flex gap-2">
          {Object.entries(colors)
            .slice(0, 4)
            .map(([key, value]) => (
              <div key={key} className="text-center">
                <div
                  className="h-8 w-8 rounded-full border border-[var(--border-subtle)]"
                  style={{ backgroundColor: value }}
                />
                <p className="text-xs text-[var(--text-quiet)] mt-1 capitalize">{key}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Typography */}
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Typography</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)]">{typography.headingFont}</span> /{" "}
          {typography.bodyFont}
        </p>
        <p className="text-xs text-[var(--text-quiet)] capitalize">
          Scale: {typography.scale}
        </p>
      </div>

      {/* Voice */}
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Voice</h3>
        <p className="text-sm text-[var(--text-secondary)] capitalize">
          {voice.personality} • {voice.formality}
        </p>
        {voice.keywords && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(voice.keywords as string).split(",").map((k, i) => (
              <span
                key={i}
                className="text-xs bg-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-tertiary)]"
              >
                {k.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

