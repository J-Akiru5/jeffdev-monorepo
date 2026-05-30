import { getCommunityMembers } from "@/app/actions/community";
import { CommunityTable } from "./community-table";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const { data: members, success } = await getCommunityMembers();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Community Members</h1>
        <p className="text-sm text-white/50">
          Manage registered community portal users, view roles, and handle list signups.
        </p>
      </div>

      {/* Error State */}
      {!success && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load community members. Please refresh the page.
        </div>
      )}

      {/* Community Members Table */}
      <CommunityTable members={members ?? []} />
    </div>
  );
}
