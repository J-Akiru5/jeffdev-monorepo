import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkspaceDetail } from "@/app/actions/manage";
import { WorkspaceMembersManager } from "@/components/admin/workspace-members-manager";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getWorkspaceDetail(id);

  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/workspaces"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workspaces
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{workspace.name}</h1>
        <p className="text-sm text-white/50">
          {workspace.members.length} members &middot; {workspace.departments.length} departments &middot; {workspace.projects.length} projects
        </p>
      </div>

      <WorkspaceMembersManager
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        members={workspace.members}
        departments={workspace.departments}
      />

      {workspace.projects.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <h3 className="text-sm font-medium text-white mb-3">Projects</h3>
          <div className="flex flex-wrap gap-2">
            {workspace.projects.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color || "#6366f1" }}
                />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
