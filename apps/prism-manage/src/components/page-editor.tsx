"use client";

/**
 * Page Editor (arc 3 · D6)
 * ------------------------
 * Title, icon, and a block-based content area (PageBlocks). Content autosaves
 * 800ms after the last edit; the title saves on blur; Ctrl/Cmd+S saves now.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Page } from "@/app/actions/pages";
import { getPage, updatePage } from "@/app/actions/pages";
import {
  PageBlocks,
  normalizeBlocks,
  serializeBlocks,
  type Block,
} from "@/components/page-blocks";

interface PageEditorProps {
  pageId: string;
}

export function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadPage() {
      const data = await getPage(pageId);
      if (data) {
        setPage(data);
        setTitle(data.title);
        setBlocks(normalizeBlocks(data.content));
      }
      loadedRef.current = true;
      setLoading(false);
    }
    loadPage();
  }, [pageId]);

  const persist = useCallback(
    async (nextTitle: string, nextBlocks: Block[]) => {
      if (!page) return;
      setSaving(true);
      await updatePage(page.id, {
        title: nextTitle || "Untitled",
        content: serializeBlocks(nextBlocks),
      });
      setSaving(false);
    },
    [page],
  );

  const handleBlocksChange = useCallback(
    (next: Block[]) => {
      setBlocks(next);
      if (!loadedRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(title, next);
      }, 800);
    },
    [persist, title],
  );

  // Save the title on blur
  const handleTitleBlur = useCallback(() => {
    void persist(title, blocks);
  }, [persist, title, blocks]);

  // Save on Cmd/Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void persist(title, blocks);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [persist, title, blocks]);

  // Clear a pending autosave on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

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
        onBlur={handleTitleBlur}
        placeholder="Untitled"
        aria-label="Page title"
        className="w-full bg-transparent text-3xl font-bold text-white placeholder-white/20 outline-none"
      />

      {/* Meta */}
      <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
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
        {blocks.length === 0 && (
          <p className="px-2 pb-1 text-sm text-white/25">
            Start writing — press Enter for a new block.
          </p>
        )}
        <PageBlocks blocks={blocks} onChange={handleBlocksChange} />
      </div>
    </div>
  );
}
