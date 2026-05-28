import Link from "next/link";
import { getWorkspaces } from "@/app/actions/manage";
import { Users, Building2, ArrowRight } from "lucide-react";

export default async function WorkspacesPage() {
  const workspaces = await getWorkspaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
        <p className="text-sm text-white/50">
          {workspaces.length} workspaces across Prism Manage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-white/30">
            No workspaces found
          </div>
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/admin/workspaces/${ws.id}`}
              className="group rounded-lg border border-white/5 bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                    <Building2 className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                <Users className="h-3 w-3" />
                <span>{ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
