"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * AI Skill Generator (Phase 3): describe a workflow, get a step-by-step
 * procedural skill saved into this project.
 */
export default function GenerateSkillPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; stepCount: number } | null>(
    null,
  );

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/skills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: slug, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult({ name: data.name, stepCount: data.stepCount });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href={`/projects/${slug}/skills`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Skills
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          Generate Skill
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Describe a workflow and Prism will document it into a step-by-step
          procedural guide your agents can follow mechanically.
        </p>
      </div>

      <form onSubmit={generate} className="space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}
        {result && (
          <div
            role="status"
            className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200"
          >
            Saved “{result.name}” ({result.stepCount} steps).{" "}
            <Link
              href={`/projects/${slug}/skills`}
              className="underline font-medium"
            >
              View in Skills
            </Link>
            .
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-white">
            Workflow description
          </label>
          <textarea
            id="description"
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. When we add a new API route, it must have a Zod input schema, a rate limit, an ownership check on any id parameter, and a test covering the unauthorized case."
            className="w-full rounded-md border border-white/10 bg-white/2 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors font-mono text-xs"
          />
          <p className="text-xs text-white/40">
            One AI generation is charged per successful run; failures are refunded.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || description.trim().length < 10}
          className="inline-flex items-center gap-2 rounded-md bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Skill
            </>
          )}
        </button>
      </form>
    </div>
  );
}
