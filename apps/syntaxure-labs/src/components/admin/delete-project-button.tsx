"use client";

/**
 * Delete Project Button Component
 * --------------------------------
 * Client component to handle project deletion with confirmation.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProject } from "@/app/actions/projects";

interface Props {
  slug: string;
}

export function DeleteProjectButton({ slug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This will permanently remove all project details.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProject(slug);
      if (result.success) {
        toast.success("Project deleted successfully");
        router.push("/admin/projects");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete project");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 text-red-400/70" />
      )}
      Delete
    </button>
  );
}
