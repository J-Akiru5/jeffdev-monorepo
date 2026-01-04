"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Save, Loader2 } from "lucide-react";
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
  
  const [state, formAction, isPending] = useActionState<{ success?: boolean; error?: string } | null, FormData>(updateRule, null);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setSuggestions([]);
    
    try {
      const result = await enhanceRule(rule._id, rule.name, content, rule.category);
      if (result.success && result.enhancedContent) {
        setContent(result.enhancedContent);
        setSuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
    } finally {
      setIsEnhancing(false);
    }
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

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
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
    </div>
  );
}
