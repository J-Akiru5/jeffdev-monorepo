"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useActionState } from "react";
import { ArrowLeft, BookOpen, Plus, Trash2, GripVertical } from "lucide-react";
import { GlassPanel, Button } from "@jdstudio/ui";
import { createSkill, type SkillActionState } from "../actions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function NewSkillPage({ params }: Props) {
  const { slug } = use(params);
  return <NewSkillForm slug={slug} />;
}

function NewSkillForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<SkillActionState, FormData>(
    createSkill,
    null
  );

  const [steps, setSteps] = useState([{ id: crypto.randomUUID(), title: "", content: "" }]);

  const addStep = () => {
    setSteps([...steps, { id: crypto.randomUUID(), title: "", content: "" }]);
  };

  const removeStep = (id: string) => {
    if (steps.length === 1) return;
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, field: "title" | "content", value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href={`/projects/${slug}/skills`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Skills
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
          <BookOpen className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Create Skill</h1>
          <p className="text-sm text-white/50">
            Define a step-by-step procedural workflow.
          </p>
        </div>
      </div>

      <GlassPanel className="p-6">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="projectSlug" value={slug} />
          {/* We serialize the steps state into a hidden field for the server action */}
          <input type="hidden" name="steps" value={JSON.stringify(steps.map(({ title, content }) => ({ title, content })))} />

          <div className="space-y-4 border-b border-white/5 pb-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-white">Skill Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., Create a new API Route"
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
              />
              {state?.error?.name && <p className="text-xs text-red-400">{state.error.name[0]}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-white">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                placeholder="Brief summary of what this skill accomplishes"
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-white">Category</label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                >
                  <option value="">Select category...</option>
                  <option value="architecture">Architecture</option>
                  <option value="workflow">Workflow</option>
                  <option value="debugging">Debugging</option>
                  <option value="deployment">Deployment</option>
                  <option value="testing">Testing</option>
                  <option value="other">Other</option>
                </select>
                {state?.error?.category && <p className="text-xs text-red-400">{state.error.category[0]}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="tags" className="block text-sm font-medium text-white">Tags (comma separated)</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  placeholder="nextjs, api, routing"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Procedural Steps</h3>
              {state?.error?.steps && <p className="text-xs text-red-400">{state.error.steps[0]}</p>}
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="relative rounded-lg border border-white/10 bg-white/[0.02] p-4 pl-10 group">
                  <div className="absolute left-3 top-5 text-white/20 cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold font-mono">
                    {index + 1}
                  </div>

                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="absolute right-3 top-3 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Step Title (e.g., Create the route file)"
                      value={step.title}
                      onChange={(e) => updateStep(step.id, "title", e.target.value)}
                      required
                      className="w-full bg-transparent text-white font-medium placeholder:text-white/30 focus:outline-none"
                    />
                    
                    <textarea
                      placeholder="Detailed instructions and code examples in Markdown..."
                      value={step.content}
                      onChange={(e) => updateStep(step.id, "content", e.target.value)}
                      required
                      rows={4}
                      className="w-full rounded-md border border-white/5 bg-black/40 px-3 py-2 text-white/80 placeholder:text-white/30 focus:border-cyan-500/30 focus:outline-none transition-colors resize-y font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="secondary" onClick={addStep} className="w-full border-dashed border-white/20 hover:border-white/40">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {state?.error?.general && (
            <p className="text-sm text-red-400">{state.error.general}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="secondary" asChild>
              <Link href={`/projects/${slug}/skills`}>Cancel</Link>
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Creating..." : "Save Skill"}
            </Button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
