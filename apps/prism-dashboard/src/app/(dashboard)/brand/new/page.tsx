"use client";

import { useState, useActionState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { createBrand, type BrandFormState } from "../actions";

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
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "Modern" },
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
    null
  );

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
    setFormData(prev => {
      const keys = key.split(".");
      if (keys.length === 1) {
        return { ...prev, [key]: value };
      }
      // Nested update
      const [parent, child] = keys;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      };
    });
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back Link */}
      <Link
        href="/brand"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brands
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Create Brand Profile</h1>
        <p className="text-sm text-white/50 mt-1">
          Define your brand identity to generate consistent Prism Rules.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step > s.id
                  ? "bg-cyan-500 text-white"
                  : step === s.id
                  ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 mx-2 ${step > s.id ? "bg-cyan-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-white">{STEPS[step - 1].name}</h2>
        <p className="text-sm text-white/50">{STEPS[step - 1].description}</p>
      </div>

      {/* Form */}
      <form action={formAction}>
        {/* Hidden fields for all form data */}
        <input type="hidden" name="companyName" value={formData.companyName} />
        <input type="hidden" name="tagline" value={formData.tagline} />
        <input type="hidden" name="industry" value={formData.industry} />
        <input type="hidden" name="colors.primary" value={formData.colors.primary} />
        <input type="hidden" name="colors.secondary" value={formData.colors.secondary} />
        <input type="hidden" name="colors.accent" value={formData.colors.accent} />
        <input type="hidden" name="colors.background" value={formData.colors.background} />
        <input type="hidden" name="colors.surface" value={formData.colors.surface} />
        <input type="hidden" name="colors.text" value={formData.colors.text} />
        <input type="hidden" name="colors.textMuted" value={formData.colors.textMuted} />
        <input type="hidden" name="typography.headingFont" value={formData.typography.headingFont} />
        <input type="hidden" name="typography.bodyFont" value={formData.typography.bodyFont} />
        <input type="hidden" name="typography.monoFont" value={formData.typography.monoFont} />
        <input type="hidden" name="typography.scale" value={formData.typography.scale} />
        <input type="hidden" name="voice.personality" value={formData.voice.personality} />
        <input type="hidden" name="voice.formality" value={formData.voice.formality} />
        <input type="hidden" name="voice.keywords" value={formData.voice.keywords} />
        <input type="hidden" name="imagery.style" value={formData.imagery.style} />
        <input type="hidden" name="imagery.mood" value={formData.imagery.mood} />
        <input type="hidden" name="spacing.unit" value={formData.spacing.unit} />
        <input type="hidden" name="spacing.borderRadius" value={formData.spacing.borderRadius} />

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <StepIdentity formData={formData} updateFormData={updateFormData} />
          )}
          {step === 2 && (
            <StepColors formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepTypography formData={formData} updateFormData={updateFormData} fontOptions={FONT_OPTIONS} />
          )}
          {step === 4 && (
            <StepVoice formData={formData} updateFormData={updateFormData} />
          )}
          {step === 5 && (
            <StepReview formData={formData} />
          )}
        </div>

        {/* Error Display */}
        {state?.error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/30 p-4 mb-4">
            <p className="text-sm text-red-400">Please fix the following errors:</p>
            <ul className="mt-2 text-xs text-red-300">
              {Object.entries(state.error).map(([key, errors]) => (
                <li key={key}>{key}: {(errors as string[]).join(", ")}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-white/5">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/2 px-4 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md bg-linear-to-r from-cyan-500 to-violet-500 px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all"
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
  updateFormData 
}: { 
  formData: Record<string, unknown>; 
  updateFormData: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Company Name *</label>
        <input
          type="text"
          value={formData.companyName as string}
          onChange={(e) => updateFormData("companyName", e.target.value)}
          placeholder="Keandrew Photography"
          className="w-full rounded-md border border-white/10 bg-white/2 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Tagline</label>
        <input
          type="text"
          value={formData.tagline as string}
          onChange={(e) => updateFormData("tagline", e.target.value)}
          placeholder="Capturing Life's Authentic Moments"
          className="w-full rounded-md border border-white/10 bg-white/2 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Industry *</label>
        <select
          aria-label="Select industry"
          value={formData.industry as string}
          onChange={(e) => updateFormData("industry", e.target.value)}
          className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
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
  updateFormData 
}: { 
  formData: Record<string, unknown>; 
  updateFormData: (key: string, value: unknown) => void;
}) {
  const colors = formData.colors as Record<string, string>;
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50 mb-4">Define your brand's color palette</p>
      
      <div className="grid grid-cols-2 gap-4">
        <ColorPicker label="Primary" value={colors.primary} onChange={(v) => updateFormData("colors.primary", v)} />
        <ColorPicker label="Secondary" value={colors.secondary} onChange={(v) => updateFormData("colors.secondary", v)} />
        <ColorPicker label="Accent" value={colors.accent} onChange={(v) => updateFormData("colors.accent", v)} />
        <ColorPicker label="Background" value={colors.background} onChange={(v) => updateFormData("colors.background", v)} />
        <ColorPicker label="Surface" value={colors.surface} onChange={(v) => updateFormData("colors.surface", v)} />
        <ColorPicker label="Text" value={colors.text} onChange={(v) => updateFormData("colors.text", v)} />
        <ColorPicker label="Text Muted" value={colors.textMuted} onChange={(v) => updateFormData("colors.textMuted", v)} />
      </div>

      {/* Preview */}
      <div 
        className="mt-6 rounded-md border border-white/10 p-6"
        style={{ backgroundColor: colors.background }}
      >
        <div className="rounded-md p-4" style={{ backgroundColor: colors.surface }}>
          <h3 style={{ color: colors.text }} className="font-semibold">Preview</h3>
          <p style={{ color: colors.textMuted }} className="text-sm mt-1">
            This is how your colors look together.
          </p>
          <div className="flex gap-2 mt-4">
            <div className="px-4 py-2 rounded text-sm" style={{ backgroundColor: colors.primary, color: colors.text }}>
              Primary
            </div>
            <div className="px-4 py-2 rounded text-sm" style={{ backgroundColor: colors.accent, color: colors.background }}>
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
  onChange 
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
        className="h-10 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs text-white/50 font-mono focus:outline-none"
        />
      </div>
    </div>
  );
}

function StepTypography({ 
  formData, 
  updateFormData,
  fontOptions
}: { 
  formData: Record<string, unknown>; 
  updateFormData: (key: string, value: unknown) => void;
  fontOptions: { value: string; label: string; category: string }[];
}) {
  const typography = formData.typography as Record<string, string>;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Heading Font</label>
        <select
          aria-label="Heading font"
          value={typography.headingFont}
          onChange={(e) => updateFormData("typography.headingFont", e.target.value)}
          className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          {fontOptions.map(f => (
            <option key={f.value} value={f.value}>{f.label} ({f.category})</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Body Font</label>
        <select
          aria-label="Body font"
          value={typography.bodyFont}
          onChange={(e) => updateFormData("typography.bodyFont", e.target.value)}
          className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          {fontOptions.map(f => (
            <option key={f.value} value={f.value}>{f.label} ({f.category})</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Typography Scale</label>
        <div className="grid grid-cols-3 gap-3">
          {["compact", "default", "spacious"].map(scale => (
            <button
              key={scale}
              type="button"
              onClick={() => updateFormData("typography.scale", scale)}
              className={`rounded-md border px-4 py-3 text-sm capitalize transition-colors ${
                typography.scale === scale
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                  : "border-white/10 bg-white/2 text-white/60 hover:border-white/20"
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
  updateFormData 
}: { 
  formData: Record<string, unknown>; 
  updateFormData: (key: string, value: unknown) => void;
}) {
  const voice = formData.voice as Record<string, string>;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Brand Personality</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "minimal", label: "Minimal", desc: "Clean & understated" },
            { value: "warm", label: "Warm", desc: "Friendly & approachable" },
            { value: "bold", label: "Bold", desc: "Confident & impactful" },
            { value: "playful", label: "Playful", desc: "Fun & creative" },
            { value: "corporate", label: "Corporate", desc: "Professional & formal" },
          ].map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => updateFormData("voice.personality", p.value)}
              className={`rounded-md border px-4 py-3 text-left transition-colors ${
                voice.personality === p.value
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-white/10 bg-white/2 hover:border-white/20"
              }`}
            >
              <p className="text-sm font-medium text-white">{p.label}</p>
              <p className="text-xs text-white/50">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Formality Level</label>
        <div className="grid grid-cols-3 gap-3">
          {["casual", "balanced", "formal"].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => updateFormData("voice.formality", f)}
              className={`rounded-md border px-4 py-3 text-sm capitalize transition-colors ${
                voice.formality === f
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                  : "border-white/10 bg-white/2 text-white/60 hover:border-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Brand Keywords</label>
        <input
          type="text"
          value={voice.keywords}
          onChange={(e) => updateFormData("voice.keywords", e.target.value)}
          placeholder="authentic, timeless, elegant (comma-separated)"
          className="w-full rounded-md border border-white/10 bg-white/2 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
        />
        <p className="text-xs text-white/40">Up to 10 keywords that define your brand</p>
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
      <p className="text-sm text-white/50">Review your brand profile before creating</p>
      
      {/* Identity */}
      <div className="rounded-md border border-white/5 bg-white/2 p-4">
        <h3 className="text-sm font-medium text-white mb-2">Identity</h3>
        <p className="text-lg font-semibold text-white">{formData.companyName as string}</p>
        {typeof formData.tagline === "string" && formData.tagline && <p className="text-sm text-white/50">{formData.tagline}</p>}
        <span className="inline-block mt-2 text-xs text-cyan-400 capitalize">{formData.industry as string}</span>
      </div>

      {/* Colors Preview */}
      <div className="rounded-md border border-white/5 bg-white/2 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Colors</h3>
        <div className="flex gap-2">
          {Object.entries(colors).slice(0, 4).map(([key, value]) => (
            <div key={key} className="text-center">
              <div 
                className="h-8 w-8 rounded-full border border-white/10"
                style={{ backgroundColor: value }}
              />
              <p className="text-xs text-white/40 mt-1 capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="rounded-md border border-white/5 bg-white/2 p-4">
        <h3 className="text-sm font-medium text-white mb-2">Typography</h3>
        <p className="text-sm text-white/70">
          <span className="text-white">{typography.headingFont}</span> / {typography.bodyFont}
        </p>
        <p className="text-xs text-white/40 capitalize">Scale: {typography.scale}</p>
      </div>

      {/* Voice */}
      <div className="rounded-md border border-white/5 bg-white/2 p-4">
        <h3 className="text-sm font-medium text-white mb-2">Voice</h3>
        <p className="text-sm text-white/70 capitalize">
          {voice.personality} • {voice.formality}
        </p>
        {voice.keywords && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(voice.keywords as string).split(",").map((k, i) => (
              <span key={i} className="text-xs bg-white/5 px-2 py-0.5 rounded text-white/50">
                {k.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
