"use client";

/**
 * Page Editor
 * -----------
 * A clean, Notion-like page editor with title, icon, and content area.
 * Uses a simple textarea for content (MVP) — can be upgraded to a block
 * editor later.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Page } from "@/app/actions/pages";
import { getPage, updatePage } from "@/app/actions/pages";

interface PageEditorProps {
  pageId: string;
}

export function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      const data = await getPage(pageId);
      if (data) {
        setPage(data);
        setTitle(data.title);
        // Convert content array to text (MVP: simple text)
        if (Array.isArray(data.content) && data.content.length > 0) {
          const textContent = data.content
            .map((block: Record<string, unknown>) => {
              if (typeof block === "object" && block !== null) {
                return (block.text as string) || JSON.stringify(block);
              }
              return String(block);
            })
            .join("\n");
          setContent(textContent);
        }
      }
      setLoading(false);
    }
    loadPage();
  }, [pageId]);

  const handleSave = useCallback(async () => {
    if (!page) return;
    setSaving(true);

    // Convert text to content array (MVP: simple text blocks)
    const contentBlocks = content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => ({ type: "text", text: line }));

    await updatePage(page.id, {
      title: title || "Untitled",
      content: contentBlocks,
    });
    setSaving(false);
  }, [page, title, content]);

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Save on Cmd/Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-white/40">Page not found</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/70"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Page icon */}
      <div className="mb-2 text-4xl">{page.icon}</div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Untitled"
        className="w-full bg-transparent text-3xl font-bold text-white placeholder-white/20 outline-none"
      />

      {/* Meta */}
      <div className="mt-2 flex items-center gap-4 text-xs text-white/30">
        <span>
          Last edited{" "}
          {new Date(page.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {saving && (
          <span className="flex items-center gap-1 text-indigo-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          placeholder="Start writing..."
          className="min-h-[400px] w-full resize-none bg-transparent text-base leading-relaxed text-white/70 placeholder-white/20 outline-none"
          rows={20}
        />
      </div>
    </div>
  );
}
