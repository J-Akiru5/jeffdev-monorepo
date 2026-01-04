"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { GlassPanel, Button } from "@jdstudio/ui";
import { updateProject, deleteProject, type ProjectActionState } from "../../actions";

/**
 * Project Settings Page
 * Rename, change settings, or delete a project.
 */
export default function ProjectSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [updateState, updateAction, updatePending] = useActionState<ProjectActionState, FormData>(
    updateProject,
    null
  );
  const [deleteState, deleteAction, deletePending] = useActionState<ProjectActionState, FormData>(
    deleteProject,
    null
  );

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Back Link */}
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
          <SettingsIcon className="h-5 w-5 text-white/40" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Project Settings</h1>
          <p className="text-sm text-white/50">
            Manage your project configuration.
          </p>
        </div>
      </div>

      {/* Update Form */}
      <GlassPanel className="p-6">
        <h2 className="text-lg font-medium text-white mb-4">General</h2>
        
        <form action={updateAction} className="space-y-4">
          {/* Hidden slug field */}
          <input type="hidden" name="slug" value={slug} />
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-white">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="My Project"
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            {updateState?.error?.name && (
              <p className="text-xs text-red-400">{updateState.error.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="stack" className="block text-sm font-medium text-white">
              Tech Stack
            </label>
            <select
              id="stack"
              name="stack"
              className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
            >
              <option value="nextjs">Next.js</option>
              <option value="react">React</option>
              <option value="react-native">React Native</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="designSystem" className="block text-sm font-medium text-white">
              Design System
            </label>
            <select
              id="designSystem"
              name="designSystem"
              className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
            >
              <option value="jdstudio">JDStudio</option>
              <option value="glassmorphic">Glassmorphic</option>
              <option value="bare-minimum">Bare Minimum</option>
              <option value="8bit-nostalgia">8-Bit Nostalgia</option>
              <option value="keandrew">Keandrew</option>
              <option value="custom">Custom Brand</option>
            </select>
          </div>

          {updateState?.success && (
            <p className="text-sm text-emerald-400">Project updated successfully!</p>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            disabled={updatePending}
            className="mt-4"
          >
            {updatePending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </GlassPanel>

      {/* Danger Zone */}
      <GlassPanel className="p-6 border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-medium text-red-400">Danger Zone</h2>
        </div>
        
        <p className="text-sm text-white/50 mb-4">
          Once you delete a project, there is no going back. All rules, components, and context data will be permanently removed.
        </p>

        <form action={deleteAction}>
          {/* Hidden slug field */}
          <input type="hidden" name="slug" value={slug} />
          
          <Button 
            type="submit"
            variant="secondary"
            disabled={deletePending}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deletePending ? "Deleting..." : "Delete Project"}
          </Button>
        </form>

        {deleteState?.error?.general && (
          <p className="text-sm text-red-400 mt-2">{deleteState.error.general}</p>
        )}
      </GlassPanel>
    </div>
  );
}
