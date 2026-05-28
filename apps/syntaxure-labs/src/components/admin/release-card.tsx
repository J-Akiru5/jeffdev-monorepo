"use client";

import Link from "next/link";
import { Edit, Trash2, Sparkles, GitCommit, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmDialog } from "@syntaxure/ui";
import { deleteRelease } from "@/app/actions/releases";

interface ReleaseCardProps {
  release: {
    id: string;
    title: string;
    version?: string | null;
    date: string;
    type: "tool" | "update" | "patch";
    description: string;
    link?: string | null;
    tags?: string[] | null;
    is_featured: boolean;
  };
}

const typeIcons = {
  tool: Sparkles,
  update: ArrowUpRight,
  patch: GitCommit,
};

const typeColors = {
  tool: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  update: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  patch: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export function ReleaseCard({ release }: ReleaseCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const TypeIcon = typeIcons[release.type];

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteRelease(release.id);
    setIsDeleting(false);
    if (result.success) {
      toast.success("Release deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete release");
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12]">
        <div
          className={`rounded-md border p-2 ${typeColors[release.type] || typeColors.update}`}
        >
          <TypeIcon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-white truncate">
              {release.title}
            </h3>
            {release.version && (
              <span className="shrink-0 rounded-sm border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                v{release.version}
              </span>
            )}
            {release.is_featured && (
              <span className="shrink-0 rounded-sm border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">
                Featured
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-white/50 line-clamp-1">
            {release.description}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/30">
            <span>{new Date(release.date).toLocaleDateString()}</span>
            <span className="capitalize">{release.type}</span>
            {release.tags && release.tags.length > 0 && (
              <span>{release.tags.join(", ")}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/admin/community/${release.id}/edit`}
            className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-md p-2 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete this release?"
        description="This action cannot be undone. The release will be permanently removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
