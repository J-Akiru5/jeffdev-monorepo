"use client";

/**
 * AI Kitchen - Component Generator
 *
 * Chat interface for generating components with Gemini
 * Features: Live preview, syntax highlighting, save to library, export
 */

import { useState, useEffect, useRef } from "react";
import { Save, Download, Loader2, Library, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { ComponentTabs } from "@/components/ui/component-tabs";
import { Button } from "@syntaxure/ui";

type DesignSystem =
  | "jdstudio"
  | "bare-minimum"
  | "glassmorphic"
  | "8bit-nostalgia";
type Stack = "react" | "nextjs" | "react-native";

interface GeneratedComponent {
  code: string;
  explanation: string;
  rules?: string;
}

interface LibraryStats {
  count: number;
  limit: number;
}

/**
 * Custom dark-mode select component.
 * Replaces native <select> which renders with OS white background on Chrome/Windows.
 * Follows JDStudio Visual Constitution: bg-void, border-subtle, sharp radius.
 */
function CustomSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (val: T) => void;
  options: { value: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-white/70 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition-colors hover:border-white/20 focus:border-cyan-500 focus:outline-none"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a] shadow-xl shadow-black/50">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                opt.value === value
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DESIGN_SYSTEM_OPTIONS: { value: DesignSystem; label: string }[] = [
  { value: "jdstudio", label: "JDStudio (Glassmorphic)" },
  { value: "bare-minimum", label: "Bare Minimum" },
  { value: "glassmorphic", label: "Glassmorphic" },
  { value: "8bit-nostalgia", label: "8-Bit Nostalgia" },
];

const STACK_OPTIONS: { value: Stack; label: string }[] = [
  { value: "nextjs", label: "Next.js" },
  { value: "react", label: "React.js" },
  { value: "react-native", label: "React Native" },
];

export function ComponentGenerator() {
  const [prompt, setPrompt] = useState("");
  const [designSystem, setDesignSystem] = useState<DesignSystem>("jdstudio");
  const [stack, setStack] = useState<Stack>("nextjs");
  const [generateRules, setGenerateRules] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GeneratedComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({
    count: 0,
    limit: 5,
  });

  // Fetch library stats on mount
  useEffect(() => {
    fetchLibraryStats();
  }, []);

  const fetchLibraryStats = async () => {
    try {
      const response = await fetch("/api/components");
      if (response.ok) {
        const data = await response.json();
        setLibraryStats({ count: data.count, limit: data.limit });
      }
    } catch {
      // Ignore errors fetching stats
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          designSystem,
          stack,
          generateRules,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult({
        code: data.component.code,
        explanation: data.component.explanation,
        rules: data.rules,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Extract component name from code
      const nameMatch = result.code.match(/(?:function|const)\s+(\w+)/);
      const componentName = nameMatch?.[1] || "Component";

      const response = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: componentName,
          description: result.explanation,
          code: result.code,
          rules: result.rules,
          designSystem,
          stack,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setSaveMessage("✓ Saved to library");
      fetchLibraryStats(); // Refresh stats
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!result) return;

    // Create file content
    const content = result.code;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Extract component name
    const nameMatch = result.code.match(/(?:function|const)\s+(\w+)/);
    const componentName = nameMatch?.[1] || "Component";

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${componentName}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Library Link */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/40">
          {libraryStats.limit === -1
            ? `${libraryStats.count} components saved`
            : `${libraryStats.count} of ${libraryStats.limit} components`}
        </div>
        <Link
          href="/generate/library"
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Library className="h-4 w-4" />
          View Library
        </Link>
      </div>

      {/* Configuration */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Design System Select */}
        <CustomSelect<DesignSystem>
          label="Design System"
          value={designSystem}
          onChange={setDesignSystem}
          options={DESIGN_SYSTEM_OPTIONS}
        />

        {/* Stack Select */}
        <CustomSelect<Stack>
          label="Stack"
          value={stack}
          onChange={setStack}
          options={STACK_OPTIONS}
        />

        {/* Generate Rules Toggle */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={generateRules}
              onChange={(e) => setGenerateRules(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-white/70">Generate usage rules</span>
          </label>
        </div>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Describe your component
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a pricing card with a title, price, feature list, and CTA button..."
          rows={4}
          className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none resize-none"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="group relative w-full overflow-hidden rounded-md border border-cyan-500/20 bg-cyan-500/5 px-6 py-3 transition-all hover:border-cyan-500/35 hover:bg-cyan-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
        {isLoading ? (
          <span className="flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-wider text-cyan-400">
            <Loader2 className="animate-spin h-4 w-4" />
            Generating
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-wider text-cyan-400 font-semibold">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Generate Component
          </span>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">Explanation</h3>
            <p className="text-white/70 text-sm">{result.explanation}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save to Library
            </Button>

            <Button
              onClick={handleExport}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export File
            </Button>

            {saveMessage && (
              <span
                className={`text-sm ${saveMessage.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}
              >
                {saveMessage}
              </span>
            )}
          </div>

          {/* Tabbed Output */}
          <ComponentTabs
            code={result.code}
            rules={result.rules}
            defaultTab="code"
            collapsible={true}
          />
        </div>
      )}
    </div>
  );
}
