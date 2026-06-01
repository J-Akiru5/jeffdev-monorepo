"use client";

/**
 * Content Editor Shell
 * ---------------------
 * Shared form shell for content editing pages.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

interface ContentEditorShellProps {
  slug: string;
  title: string;
  description: string;
  children: (props: {
    content: Record<string, any>;
    setContent: (c: Record<string, any>) => void;
  }) => React.ReactNode;
}

export function ContentEditorShell({ slug, title, description, children }: ContentEditorShellProps) {
  const router = useRouter();
  const [content, setContent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load content on mount
  useState(() => {
    (async () => {
      try {
        const { getPageContent } = await import("@/app/actions/content");
        const result = await getPageContent(slug);
        if (result.success && result.data) {
          setContent(result.data);
        }
      } catch (e) {
        console.error("Failed to load content:", e);
      }
      setInitialized(true);
    })();
  });

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { savePageContent } = await import("@/app/actions/content");
      const result = await savePageContent(slug, content);
      if (result.success) {
        setSuccess("Content saved successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to save");
      }
    } catch (e) {
      setError("Failed to save content");
    } finally {
      setLoading(false);
    }
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{description}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {children({ content, setContent })}
    </div>
  );
}

/**
 * Simple field component for text inputs.
 */
export function ContentField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  if (multiline) {
    return (
      <div>
        <label className="block text-xs text-white/50 mb-1">{label}</label>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
      />
    </div>
  );
}
