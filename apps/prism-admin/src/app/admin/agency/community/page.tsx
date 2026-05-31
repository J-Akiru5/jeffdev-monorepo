import { getCommunityMembers, getCommunityPosts } from "@/app/actions/community";
import { CommunityTabs } from "./community-tabs";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const [{ data: members, success: membersSuccess }, { data: posts, success: postsSuccess }] =
    await Promise.all([getCommunityMembers(), getCommunityPosts()]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-sm text-white/50">
          Manage community posts, members, and invitations.
        </p>
      </div>

      {/* Error States */}
      {!membersSuccess && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load community members. Please refresh the page.
        </div>
      )}
      {!postsSuccess && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load community posts. Please refresh the page.
        </div>
      )}

      {/* Tabs */}
      <CommunityTabs posts={posts ?? []} members={members ?? []} />
    </div>
  );
}
