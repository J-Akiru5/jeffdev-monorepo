"use client";

import { useState } from "react";
import { Trash2, Power, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string;
  stepCount: number;
  isActive: boolean;
  source: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillCard
// ─────────────────────────────────────────────────────────────────────────────

function SkillCard({
  skill,
  onDelete,
  onToggle,
  projectSlug,
}: {
  skill: SkillItem;
  onDelete: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
  projectSlug: string;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isActive, setIsActive] = useState(skill.isActive);

  const handleToggle = async () => {
    const next = !isActive;
    setIsActive(next); // optimistic
    setToggling(true);
    try {
      const res = await fetch(`/api/v1/skills/${skill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        setIsActive(!next); // rollback
      } else {
        onToggle(skill.id, next);
      }
    } catch {
      setIsActive(!next); // rollback
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete skill "${skill.name}"? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/skills/${skill.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(skill.id);
      }
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`group rounded-md border bg-white/[0.02] p-4 transition-all ${
        isActive
          ? "border-white/[0.07] hover:border-white/[0.12]"
          : "border-white/[0.03] opacity-50 hover:opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <Link
              href={`/projects/${projectSlug}/skills/${skill.id}`}
              className="text-sm font-medium text-white hover:text-cyan-400 transition-colors truncate"
            >
              {skill.name}
            </Link>
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/5 text-white/40 border border-white/10">
              {skill.stepCount} STEPS
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1 truncate">
            {skill.category} · {skill.source}
          </p>
          {skill.description && (
            <p className="text-xs text-white/25 mt-1.5 line-clamp-2 leading-relaxed">
              {skill.description.slice(0, 120)}
              {skill.description.length > 120 ? "…" : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={isActive ? "Deactivate skill" : "Activate skill"}
            className={`p-1.5 rounded transition-colors ${
              isActive
                ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                : "text-white/20 hover:text-white/50 hover:bg-white/5"
            } disabled:opacity-50`}
          >
            <Power className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete skill"
            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* ID */}
          <span className="font-mono text-[10px] text-white/20 ml-1">
            #{skill.id.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillsList (stateful wrapper)
// ─────────────────────────────────────────────────────────────────────────────

export function SkillsList({
  skills: initialSkills,
  projectSlug,
}: {
  skills: SkillItem[];
  projectSlug: string;
}) {
  const [skills, setSkills] = useState<SkillItem[]>(initialSkills);

  const handleDelete = (id: string) => {
    setSkills((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggle = (id: string, next: boolean) => {
    setSkills((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: next } : r)),
    );
  };

  const activeCount = skills.filter((r) => r.isActive).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white">
          <BookOpen className="inline-block h-4 w-4 mr-2 text-cyan-400" />
          Procedural Skills
          {skills.length > 0 && (
            <span className="ml-2 text-xs text-white/30">
              {activeCount}/{skills.length} active
            </span>
          )}
        </h2>
        <div className="flex gap-3">
          <Link
            href={`/projects/${projectSlug}/skills/generate`}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            ✨ Generate
          </Link>
          <Link
            href={`/projects/${projectSlug}/skills/new`}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            + Add Skill
          </Link>
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-md border border-white/5 bg-white/[0.01] p-8 text-center">
          <p className="text-sm text-white/40">
            No skills yet. Create a procedural guide to teach the AI a workflow.
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link
              href={`/projects/${projectSlug}/skills/new`}
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              Create manually
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href={`/projects/${projectSlug}/skills/generate`}
              className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            >
              Generate with AI
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onDelete={handleDelete}
              onToggle={handleToggle}
              projectSlug={projectSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
