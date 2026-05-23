"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { createProject, type CreateProjectState } from "../actions";

/**
 * Project Baker - New Project Creation Form
 * Core feature for creating Prism contexts.
 */
export default function NewProjectPage() {
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(
    createProject,
    null
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Create New Project</h1>
        <p className="text-sm text-white/50 mt-1">
          Set up your context environment for AI-assisted development.
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-white">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="My Awesome Project"
            className="w-full rounded-md border border-white/10 bg-white/2 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
          />
          {state?.error?.name && (
            <p className="text-xs text-red-400">{state.error.name[0]}</p>
          )}
          <p className="text-xs text-white/40">
            This will be used to generate your project slug.
          </p>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <label htmlFor="stack" className="block text-sm font-medium text-white">
            Tech Stack
          </label>
          <select
            id="stack"
            name="stack"
            required
            defaultValue="nextjs"
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
          >
            <option value="nextjs">Next.js</option>
            <option value="react">React</option>
            <option value="react-native">React Native</option>
          </select>
          <p className="text-xs text-white/40">
            Primary framework for component generation.
          </p>
        </div>

        {/* Design System / Vibe */}
        <div className="space-y-2">
          <label htmlFor="designSystem" className="block text-sm font-medium text-white">
            Design System (Vibe)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <VibeOption 
              value="jdstudio" 
              label="JDStudio" 
              description="Dark void, cyan/purple accents"
              defaultChecked
            />
            <VibeOption 
              value="glassmorphic" 
              label="Glassmorphic" 
              description="Heavy blur, gradient borders"
            />
            <VibeOption 
              value="bare-minimum" 
              label="Bare Minimum" 
              description="Pure black/white, no effects"
            />
            <VibeOption 
              value="8bit-nostalgia" 
              label="8-Bit Nostalgia" 
              description="Pixel fonts, retro colors"
            />
            <VibeOption 
              value="keandrew" 
              label="Keandrew" 
              description="Black/beige, sophisticated"
            />
            <VibeOption 
              value="custom" 
              label="Custom Brand" 
              description="Define your own brand"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-[#050505] disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VibeOption({ 
  value, 
  label, 
  description,
  defaultChecked = false
}: { 
  value: string; 
  label: string; 
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="relative flex cursor-pointer">
      <input
        type="radio"
        name="designSystem"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <div className="w-full rounded-md border border-white/10 bg-white/2 p-4 transition-all peer-checked:border-cyan-500/50 peer-checked:bg-cyan-500/5 hover:border-white/20">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
      </div>
    </label>
  );
}
