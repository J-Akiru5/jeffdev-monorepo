"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Save, Loader2, X, Check, RotateCcw } from "lucide-react";
import { Button, GlassPanel, Badge } from "@jdstudio/ui";
import { updateRule, enhanceRule } from "./actions";

interface RuleEditFormProps {
  rule: {
    _id: string;
    name: string;
    category: string;
    priority: number;
    content: string;
    description?: string;
  };
}

export function RuleEditForm({ rule }: RuleEditFormProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [content, setContent] = useState(rule.content);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<{ success?: boolean; error?: string } | null, FormData>(updateRule, null);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setEnhanceError(null);
    setPreviewContent(null);
    
    try {
      const result = await enhanceRule(rule._id, rule.name, content, rule.category);
      if (result.success && result.enhancedContent) {
        setPreviewContent(result.enhancedContent);
        setSuggestions(result.suggestions || []);
        setShowPreview(true);
      } else {
        setEnhanceError(result.error || "Enhancement failed");
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
      setEnhanceError(error instanceof Error ? error.message : "Enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhancement = () => {
    if (previewContent) {
      setContent(previewContent);
      setShowPreview(false);
      setPreviewContent(null);
    }
  };

  const handleDiscardEnhancement = () => {
    setShowPreview(false);
    setPreviewContent(null);
    setSuggestions([]);
  };

  const handleRegenerate = () => {
    setShowPreview(false);
    handleEnhance();
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="info">{rule.category}</Badge>
            <span className="text-xs text-white/40">Priority: {rule.priority}</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{rule.name}</h1>
        </div>
        
        <Button
          type="button"
          variant="secondary"
          onClick={handleEnhance}
          disabled={isEnhancing}
          className="gap-2"
        >
          {isEnhancing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Enhance with AI
            </>
          )}
        </Button>
      </div>

      {/* Enhancement Error */}
      {enhanceError && (
        <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {enhanceError}
        </div>
      )}

      {/* AI Suggestions (shown after accepting) */}
      {suggestions.length > 0 && !showPreview && (
        <GlassPanel className="p-4 border-cyan-500/30 bg-cyan-500/5">
          <h3 className="text-sm font-medium text-cyan-400 mb-2">AI Suggestions</h3>
          <ul className="list-disc list-inside space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-white/70">{suggestion}</li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="ruleId" value={rule._id} />
        <input type="hidden" name="slug" value={slug} />
        
        {/* Rule Content */}
        <GlassPanel className="p-6">
          <label htmlFor="content" className="block text-sm font-medium text-white mb-3">
            Rule Content
          </label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full rounded-md border border-white/10 bg-black/50 px-4 py-3 text-sm text-white font-mono placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
            placeholder="Write your rule content in markdown..."
          />
          <p className="text-xs text-white/40 mt-2">
            Use markdown for formatting. Include code examples with ``` blocks.
          </p>
        </GlassPanel>

        {/* Status Messages */}
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-400">Rule updated successfully!</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/projects/${slug}`)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Enhanced Rule Preview</h3>
                  <p className="text-xs text-white/50">Review the AI-enhanced content before applying</p>
                </div>
              </div>
              <button
                onClick={handleDiscardEnhancement}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-white/80 bg-black/50 p-4 rounded-lg border border-white/10 font-mono">
                  {previewContent}
                </pre>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-4 p-3 rounded-md border border-cyan-500/20 bg-cyan-500/5">
                  <h4 className="text-xs font-medium text-cyan-400 mb-2">💡 Additional Suggestions</h4>
                  <ul className="space-y-1">
                    {suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-white/60">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={handleRegenerate}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Regenerate
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDiscardEnhancement}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Discard
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAcceptEnhancement}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
