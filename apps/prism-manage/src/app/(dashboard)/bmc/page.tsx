"use client";

/**
 * Business Model Canvas (/bmc)
 * ----------------------------
 * The 9 Osterwalder blocks, editable by the COO/CEO, viewable by all
 * founders/C-levels. Seeded from the company's business facts.
 */

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { OperationsGuard } from "@/components/operations-guard";
import {
  getBmcSections,
  seedBmcData,
  upsertBmcSection,
  type BmcSectionData,
} from "@/app/actions/operations";
import { BMC_BLOCKS } from "@/lib/bmc-blocks";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "sonner";

export default function BmcPage() {
  return (
    <OperationsGuard mode="bmc">
      <BmcCanvas />
    </OperationsGuard>
  );
}

function BmcCanvas() {
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const canEdit =
    userRole === "founder" &&
    (!cLevelTitle || cLevelTitle === "ceo" || cLevelTitle === "coo");

  const [sections, setSections] = useState<BmcSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    const data = await getBmcSections();
    setSections(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (section: BmcSectionData) => {
    setEditingBlock(section.block);
    setDraft(section.content);
  };

  const save = async (block: string) => {
    setSaving(true);
    try {
      const result = await upsertBmcSection(
        block as BmcSectionData["block"],
        draft,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Block saved");
      setEditingBlock(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedBmcData();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.inserted
          ? `Seeded ${result.inserted} block${result.inserted === 1 ? "" : "s"}`
          : "Canvas already seeded",
      );
      await load();
    } finally {
      setSeeding(false);
    }
  };

  const isEmpty = sections.every((s) => !s.content.trim());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Model Canvas</h1>
          <p className="mt-1 text-sm text-white/40">
            The nine building blocks of the business — value, delivery, and
            capture.
            {canEdit ? " You can edit." : " Read-only (COO/CEO can edit)."}
          </p>
        </div>
        {canEdit && isEmpty && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {seeding ? "Seeding…" : "Seed from business facts"}
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {BMC_BLOCKS.map((blockMeta) => {
          const section = sections.find((s) => s.block === blockMeta.key);
          const isEditing = editingBlock === blockMeta.key;

          return (
            <div
              key={blockMeta.key}
              className="flex flex-col rounded-xl border border-border glass-subtle p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-violet-300/80">
                  {blockMeta.label}
                </h2>
                {canEdit && !isEditing && (
                  <button
                    onClick={() =>
                      section
                        ? startEdit(section)
                        : startEdit({ block: blockMeta.key, content: "", updatedAt: null })
                    }
                    className="rounded p-1 text-white/25 transition-colors hover:text-white/70"
                    title="Edit block"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    autoFocus
                    className="flex-1 resize-none rounded-lg border border-border bg-glass-04 px-3 py-2 text-xs text-white/70 outline-none focus:border-cyan-500/50"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBlock(null)}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-white/50 hover:border-border-active"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                    <button
                      onClick={() => save(blockMeta.key)}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-cyan-500 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-cyan-400 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="flex-1 whitespace-pre-wrap text-xs leading-relaxed text-white/55">
                  {section?.content?.trim() || (
                    <span className="text-white/25">Empty — edit to fill this block.</span>
                  )}
                </p>
              )}

              {section?.updatedAt && !isEditing && (
                <p className="mt-2 font-mono text-[9px] text-white/20">
                  Updated {new Date(section.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
