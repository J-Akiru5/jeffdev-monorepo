"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Terminal,
  Box,
  Bug,
  Pencil,
  Trash2,
  ExternalLink,
  Star,
} from "lucide-react";
import { cn } from "@syntaxure/ui";
import { deleteRelease } from "@/app/actions/releases";

interface Release {
  id: string;
  title: string;
  version: string | null;
  date: string;
  type: "tool" | "update" | "patch";
  description: string;
  link: string | null;
  tags: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const typeConfig = {
  tool: {
    icon: Terminal,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    label: "Tool",
  },
  update: {
    icon: Box,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    label: "Update",
  },
  patch: {
    icon: Bug,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Patch",
  },
};

export function ReleasesTable({ releases }: { releases: Release[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release?")) return;
    setDeleting(id);
    const result = await deleteRelease(id);
    setDeleting(null);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete release.");
    }
  };

  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] py-16">
        <Terminal className="h-10 w-10 text-white/20" />
        <p className="mt-4 text-sm text-white/40">No releases yet.</p>
        <Link
          href="/admin/agency/releases/new"
          className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Create your first release
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-white/[0.06]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
              Type
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
              Title
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
              Version
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
              Date
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
              Featured
            </th>
            <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/30">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {releases.map((release) => {
            const config = typeConfig[release.type];
            const Icon = config.icon;

            return (
              <tr
                key={release.id}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md border",
                      config.bg,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/90">
                      {release.title}
                    </span>
                    {release.link && (
                      <a
                        href={release.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/20 hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/40 line-clamp-1">
                    {release.description}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {release.version ? (
                    <span className="font-mono text-xs text-white/50">
                      {release.version}
                    </span>
                  ) : (
                    <span className="text-xs text-white/20">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-white/50">
                  {new Date(release.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {release.is_featured ? (
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <span className="text-xs text-white/20">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/agency/releases/${release.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(release.id)}
                      disabled={deleting === release.id}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
