import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getReleases } from "@/app/actions/releases";
import { ReleaseCard } from "@/components/admin/release-card";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const releases = await getReleases();

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Releases</h1>
          <p className="mt-2 text-white/50">{releases.length} total releases</p>
        </div>
        <Link
          href="/admin/community/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Release
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {releases.map((release) => (
          <ReleaseCard key={release.id} release={release as any} />
        ))}

        {releases.length === 0 && (
          <div className="py-12 text-center text-white/30">
            No releases found. Create your first community update.
          </div>
        )}
      </div>
    </div>
  );
}
