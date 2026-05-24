"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";
import { GlassPanel, Button } from "@syntaxure/ui";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * AI Skill Generator
 * Currently a placeholder UI that will connect to the real generator action.
 */
export default function GenerateSkillPage({ params }: Props) {
  const { slug } = use(params);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    // TODO: Connect to actual generation action
    setTimeout(() => {
      setGenerating(false);
      alert("AI generation backend will be connected in next phase!");
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Link
        href={`/projects/${slug}/skills`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Skills
      </Link>

      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
          <Sparkles className="h-8 w-8 text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Generate Skill
        </h1>
        <p className="text-white/50 max-w-md mx-auto">
          Describe a workflow and our AI will document it into a step-by-step
          procedural guide for your agents.
        </p>
      </div>

      <GlassPanel className="p-1">
        <div className="rounded-xl bg-[#0a0a0a] border border-white/5 p-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-white/70"
              >
                What workflow do you want to document?
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={4}
                placeholder="e.g., 'How to create a new API route with rate limiting and Zod validation in this Next.js project'"
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-4">
              <h3 className="text-xs font-medium text-purple-400 mb-2 uppercase tracking-wider">
                Context Included
              </h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>✓ Project stack and design system</li>
                <li>✓ Existing architectural rules</li>
                <li>✓ Active code patterns</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]"
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Procedural Guide
                </>
              )}
            </Button>
          </form>
        </div>
      </GlassPanel>
    </div>
  );
}
