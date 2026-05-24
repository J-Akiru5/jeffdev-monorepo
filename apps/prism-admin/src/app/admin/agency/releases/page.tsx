import { Plus } from "lucide-react";
import Link from "next/link";
import { getReleases } from "@/app/actions/releases";
import { ReleasesTable } from "./releases-table";

export default async function ReleasesPage() {
  const { data: releases, success } = await getReleases();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Releases</h1>
          <p className="text-sm text-white/50">
            Manage community release notes and changelog entries
          </p>
        </div>
        <Link
          href="/admin/agency/releases/new"
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Release
        </Link>
      </div>

      {/* Error State */}
      {!success && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load releases. Please try again.
        </div>
      )}

      {/* Releases Table */}
      <ReleasesTable releases={releases ?? []} />
    </div>
  );
}
