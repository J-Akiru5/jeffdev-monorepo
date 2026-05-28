"use client";

import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteService } from "@/app/actions/services";
import type { Service } from "@/types/services";

interface ServiceCardProps {
  service: Service;
}

const statusColors: Record<string, string> = {
  published: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  draft: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  archived: "text-white/40 bg-white/5 border-white/10",
};

export function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Delete this service?")) return;
    if (!service.id) return;

    const result = await deleteService(service.id);
    if (result.success) {
      toast.success("Service deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete service");
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12]">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">{service.name}</h3>
          <span
            className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              statusColors[service.status] || statusColors.draft
            }`}
          >
            {service.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-white/50">{service.tagline}</p>
        <p className="mt-0.5 font-mono text-xs text-white/30">
          /services/{service.slug}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/admin/services/${service.id}/edit`}
          className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Edit className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md p-2 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
