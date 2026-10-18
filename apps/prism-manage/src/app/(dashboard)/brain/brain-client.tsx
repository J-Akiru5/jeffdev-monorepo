"use client";

/**
 * Company Brain — client surface
 * ------------------------------
 * Capture decisions, browse the timeline, search semantically, and ask
 * questions with citations. Workspace-scoped via the active workspace store.
 */

import { useCallback, useEffect, useState } from "react";
import { Brain, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  askBrain,
  captureMemoryEntry,
  getMemoryEntries,
  searchMemory,
  type BrainCitation,
  type MemoryEntry,
} from "@/app/actions/brain";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

const SOURCE_LABELS: Record<string, string> = {
  decision: "Decision",
  manual: "Note",
  "comment-thread": "Discussion",
  "agent-session": "Agent session",
  milestone: "Milestone",
  bmc: "BMC",
};

function ModeBadge({ mode }: { mode: string }) {
  const label =
    mode === "semantic"
      ? "semantic match"
      : mode === "keyword"
        ? "keyword match"
        : "no match";
  return (
    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-400">
      {label}
    </span>
  );
}

export function BrainClient() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [rationale, setRationale] = useState("");
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BrainCitation[] | null>(
    null,
  );
  const [searching, setSearching] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    answer: string;
    citations: BrainCitation[];
    mode: "semantic" | "keyword" | "none";
  } | null>(null);
  const [asking, setAsking] = useState(false);

  const load = useCallback(async () => {
    if (!activeWorkspaceId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getMemoryEntries(activeWorkspaceId);
    setEntries(data);
    setLoading(false);
  }, [activeWorkspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCapture = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setSaving(true);
    const result = await captureMemoryEntry({
      workspaceId: activeWorkspaceId,
      title,
      summary,
      rationale,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Decision captured");
    setTitle("");
    setSummary("");
    setRationale("");
    setCaptureOpen(false);
    await load();
  }, [activeWorkspaceId, title, summary, rationale, load]);

  const handleSearch = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setSearching(true);
    const results = await searchMemory(activeWorkspaceId, query);
    setSearchResults(results);
    setSearching(false);
  }, [activeWorkspaceId, query]);

  const handleAsk = useCallback(async () => {
    if (!activeWorkspaceId || !question.trim()) return;
    setAsking(true);
    const result = await askBrain(activeWorkspaceId, question);
    setAnswer(result);
    setAsking(false);
  }, [activeWorkspaceId, question]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Company Brain</h1>
          </div>
          <p className="mt-1 text-sm text-white/40">
            Ask why, get the receipts — a living memory of every decision.
          </p>
        </div>
        <button
          onClick={() => setCaptureOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          Log decision
        </button>
      </div>

      {/* Capture */}
      {captureOpen && (
        <div className="space-y-3 rounded-xl border border-border glass-subtle p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What was decided?"
            className="h-10 w-full rounded-lg border border-border bg-glass-04 px-3 text-sm text-white/80 outline-none placeholder:text-text-faint focus:border-cyan-500/50"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Context — what changed and why it matters"
            rows={3}
            className="w-full rounded-lg border border-border bg-glass-04 px-3 py-2 text-sm text-white/80 outline-none placeholder:text-text-faint focus:border-cyan-500/50"
          />
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Why — the reasoning (optional)"
            rows={2}
            className="w-full rounded-lg border border-border bg-glass-04 px-3 py-2 text-sm text-white/80 outline-none placeholder:text-text-faint focus:border-cyan-500/50"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCaptureOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-sm text-white/60 transition-colors hover:text-white/80"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              disabled={saving || !title.trim() || !summary.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-sm font-medium text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save decision
            </button>
          </div>
        </div>
      )}

      {/* Ask the brain */}
      <div className="space-y-3 rounded-xl border border-border glass-subtle p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          Ask the brain
        </div>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAsk();
            }}
            placeholder="Ask the brain — e.g. why did we pick Supabase?"
            className="h-10 flex-1 rounded-lg border border-border bg-glass-04 px-3 text-sm text-white/80 outline-none placeholder:text-text-faint focus:border-cyan-500/50"
          />
          <button
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {asking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Ask
          </button>
        </div>

        {answer && (
          <div className="space-y-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.03] p-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                {answer.answer ? "Answer" : "Closest matches"}
              </h3>
              <ModeBadge mode={answer.mode} />
            </div>
            {answer.answer ? (
              <p className="whitespace-pre-wrap text-sm text-white/70">
                {answer.answer}
              </p>
            ) : (
              <p className="text-xs text-white/40">
                {answer.mode === "none"
                  ? "Nothing in the brain matches that yet — log the decision and it will."
                  : "No AI answer configured (Gemini key missing) — here are the closest memory entries:"}
              </p>
            )}
            {answer.citations.length > 0 && (
              <ol className="space-y-2">
                {answer.citations.map((c, i) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border bg-glass-04 p-3 text-xs"
                  >
                    <span className="mr-2 font-mono text-cyan-400">
                      [{i + 1}]
                    </span>
                    <span className="font-medium text-white/80">{c.title}</span>
                    {c.similarity !== null && (
                      <span className="ml-2 font-mono text-[10px] text-white/30">
                        {Math.round(c.similarity * 100)}% match
                      </span>
                    )}
                    <p className="mt-1 line-clamp-2 text-white/50">
                      {c.summary}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSearch();
            }}
            placeholder="Search memories…"
            className="h-10 flex-1 rounded-lg border border-border bg-glass-04 px-3 text-sm text-white/80 outline-none placeholder:text-text-faint focus:border-cyan-500/50"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-white/60 transition-colors hover:border-border-active hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Search
          </button>
          {searchResults !== null && (
            <button
              onClick={() => {
                setSearchResults(null);
                setQuery("");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-white/40 transition-colors hover:text-white/70"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {searchResults !== null && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white/70">
              Search results
            </h3>
            {searchResults.length === 0 ? (
              <p className="rounded-lg border border-border bg-glass-04 p-3 text-xs text-white/40">
                No memories match that.
              </p>
            ) : (
              searchResults.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-border glass-subtle p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white/80">
                      {c.title}
                    </span>
                    {c.similarity !== null && (
                      <span className="font-mono text-[10px] text-white/30">
                        {Math.round(c.similarity * 100)}% match
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-white/50">
                    {c.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/70">Timeline</h3>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400/60" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-xl border border-border glass-subtle p-8 text-center">
            <Brain className="mx-auto mb-3 h-6 w-6 text-white/15" />
            <p className="text-sm text-white/40">
              No memories yet — log your first decision and it lives here.
            </p>
          </div>
        )}

        {!loading &&
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-border glass-subtle p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {entry.title}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  {SOURCE_LABELS[entry.sourceType] ?? entry.sourceType}
                </span>
                <span className="font-mono text-[10px] text-white/25">
                  {formatRelative(entry.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-white/50">
                {entry.summary}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
