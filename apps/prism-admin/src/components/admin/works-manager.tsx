"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FolderKanban,
  BookOpen,
  ChevronRight,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface WorkItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  status: string;
  type: "project" | "case_study";
  source: "projects" | "case_studies";
  created_at: string;
  client_name?: string | null;
  industry?: string | null;
  published_at?: string | null;
}

interface Props {
  projects: WorkItem[];
  caseStudies: WorkItem[];
}

// =============================================================================
// TAB CONFIG
// =============================================================================

type TabId = "all" | "published" | "drafts" | "archived";

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All Works" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
  { id: "archived", label: "Archived" },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-blue-500/20 text-blue-400",
  published: "bg-cyan-500/20 text-cyan-400",
  draft: "bg-white/10 text-white/40",
  archived: "bg-white/10 text-white/40",
};

const typeConfig: Record<string, { label: string; color: string; icon: typeof FolderKanban }> = {
  project: { label: "Project", color: "text-blue-400 bg-blue-500/10", icon: FolderKanban },
  case_study: { label: "Case Study", color: "text-violet-400 bg-violet-500/10", icon: BookOpen },
};

// =============================================================================
// HELPERS
// =============================================================================

function getHref(item: WorkItem): string {
  if (item.type === "project") {
    return item.slug
      ? `/admin/agency/projects/${item.slug}`
      : `/admin/agency/projects`;
  }
  return `/admin/agency/case-studies`;
}

function isPublished(item: WorkItem): boolean {
  return item.status === "published" || item.status === "completed";
}

function isDraft(item: WorkItem): boolean {
  return item.status === "draft" || item.status === "active";
}

function isArchived(item: WorkItem): boolean {
  return item.status === "archived";
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WorksManager({ projects, caseStudies }: Props) {
  const [tab, setTab] = useState<TabId>("all");

  // Normalize both tables into unified list
  const allWorks: WorkItem[] = [
    ...projects.map((p) => ({
      ...p,
      type: "project" as const,
      source: "projects" as const,
    })),
    ...caseStudies.map((cs) => ({
      ...cs,
      type: "case_study" as const,
      source: "case_studies" as const,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Filter by tab
  const filtered = allWorks.filter((item) => {
    switch (tab) {
      case "published":
        return isPublished(item);
      case "drafts":
        return isDraft(item);
      case "archived":
        return isArchived(item);
      default:
        return true;
    }
  });

  // Count per tab
  const counts = {
    all: allWorks.length,
    published: allWorks.filter(isPublished).length,
    drafts: allWorks.filter(isDraft).length,
    archived: allWorks.filter(isArchived).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Works</h1>
          <p className="mt-1 text-sm text-white/50">
            {allWorks.length} total ({projects.length} projects, {caseStudies.length} case studies)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/agency/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
          <Link
            href="/admin/agency/case-studies"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Case Study
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs ${tab === t.id ? "text-amber-400/60" : "text-white/20"}`}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Works List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-white/5 rounded-lg">
          <FolderKanban className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No works found</p>
          <p className="text-xs text-white/20 mt-1">
            {tab === "all" ? "Create your first project or case study" : `No ${tab} items`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const typeCfg = typeConfig[item.type] || { label: "Project", color: "text-blue-400 bg-blue-500/10", icon: FolderKanban };
            const TypeIcon = typeCfg.icon;
            const statusColor = statusColors[item.status] || statusColors.draft;

            return (
              <Link
                key={`${item.source}-${item.id}`}
                href={getHref(item)}
                className="block rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Type Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase ${typeCfg.color}`}
                  >
                    <TypeIcon className="h-3 w-3" />
                    {typeCfg.label}
                  </span>

                  {/* Title & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">
                      {item.type === "project"
                        ? item.client_name || "No client"
                        : item.industry || "No industry"}
                      {" · "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider ${statusColor}`}
                  >
                    {item.status}
                  </span>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>

                {item.description && (
                  <p className="mt-2 text-xs text-white/30 line-clamp-2 ml-[76px]">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
