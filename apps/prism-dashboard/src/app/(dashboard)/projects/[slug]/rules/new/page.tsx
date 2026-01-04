"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, FileJson } from "lucide-react";
import { GlassPanel, Button } from "@jdstudio/ui";
import { createRule, type CreateRuleState } from "../../../actions";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Create New Rule Page
 * Manual rule creation form for a project.
 */
export default function NewRulePage({ params }: Props) {
  return <NewRuleForm params={params} />;
}

function NewRuleForm({ params }: Props) {
  const [state, formAction, pending] = useActionState<CreateRuleState, FormData>(
    createRule,
    null
  );

  // We need the slug for the hidden field - using a placeholder approach
  // In production, you'd use React.use() or pass it differently
  
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Back Link */}
      <Link
        href="../"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
          <FileJson className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Create Rule</h1>
          <p className="text-sm text-white/50">
            Define a new context rule for your project.
          </p>
        </div>
      </div>

      {/* Form */}
      <GlassPanel className="p-6">
        <form action={formAction} className="space-y-6">
          {/* Hidden slug field - will be populated by URL */}
          <input type="hidden" name="projectSlug" id="projectSlug" />
          
          {/* Rule Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-white">
              Rule Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g., Use Server Components by Default"
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            {state?.error?.name && (
              <p className="text-xs text-red-400">{state.error.name[0]}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-white">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
            >
              <option value="">Select a category...</option>
              <option value="architecture">Architecture</option>
              <option value="styling">Styling</option>
              <option value="components">Components</option>
              <option value="data-fetching">Data Fetching</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="testing">Testing</option>
              <option value="other">Other</option>
            </select>
            {state?.error?.category && (
              <p className="text-xs text-red-400">{state.error.category[0]}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label htmlFor="priority" className="block text-sm font-medium text-white">
              Priority (1-100)
            </label>
            <input
              type="number"
              id="priority"
              name="priority"
              min={1}
              max={100}
              defaultValue={50}
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            <p className="text-xs text-white/40">
              Higher priority rules are applied first (1 = highest, 100 = lowest).
            </p>
            {state?.error?.priority && (
              <p className="text-xs text-red-400">{state.error.priority[0]}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-white">
              Rule Content
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={8}
              placeholder="Describe your rule in detail. This will be included in your context files for AI tools..."
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none font-mono text-sm"
            />
            {state?.error?.content && (
              <p className="text-xs text-red-400">{state.error.content[0]}</p>
            )}
          </div>

          {/* Error display */}
          {state?.error?.general && (
            <p className="text-sm text-red-400">{state.error.general}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" asChild>
              <Link href="../">Cancel</Link>
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </form>
      </GlassPanel>

      {/* Tips */}
      <GlassPanel className="p-6 border-cyan-500/10">
        <h3 className="text-sm font-medium text-white mb-3">💡 Tips for Writing Good Rules</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Be specific and actionable - avoid vague instructions</li>
          <li>• Include examples when possible</li>
          <li>• Reference file patterns (e.g., "For files in /components/*")</li>
          <li>• Explain the "why" behind the rule</li>
        </ul>
      </GlassPanel>

      {/* Script to set projectSlug from URL */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('projectSlug').value = window.location.pathname.split('/')[2] || '';
          `,
        }}
      />
    </div>
  );
}
