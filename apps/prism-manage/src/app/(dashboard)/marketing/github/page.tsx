"use client";

import { useState, useEffect } from "react";
import { GithubSyncButton } from "@/components/marketing/github-sync-button";
import type { MarketingTask, MarketingTeamMember } from "@/lib/schemas";

export default function MarketingGithubPage() {
  const [tasks, setTasks] = useState<MarketingTask[]>([]);
  const [team, setTeam] = useState<MarketingTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          const marketingTasks: MarketingTask[] = (data || [])
            .filter((t: Record<string, unknown>) => t.phase_id || t.github_issue_number)
            .map((t: Record<string, unknown>) => ({
              id: t.id as string,
              title: t.title as string,
              status: (t.status as "todo" | "in-progress" | "done") || "todo",
              phaseId: (t.phase_id as string) || "phase-1",
              ownerIds: (t.owner_ids as string[]) || [],
              priority: (t.priority as "high" | "medium" | "low") || "medium",
              platform: t.platform as string | undefined,
              description: t.description as string | undefined,
              githubIssueNumber: t.github_issue_number as number | undefined,
              createdAt: (t.created_at as string) || new Date().toISOString(),
              updatedAt: (t.updated_at as string) || new Date().toISOString(),
            }));
          setTasks(marketingTasks);
        }
      } catch {
        // Silently skip if API is unavailable
      }
      try {
        const res = await fetch("/api/marketing/team");
        if (res.ok) {
          setTeam(await res.json());
        }
      } catch {
        // Silently skip if API is unavailable
      }
      setLoading(false);
    }
    load();
  }, []);

  const syncedTasks = tasks.filter((t) => t.githubIssueNumber);
  const unSyncedTasks = tasks.filter((t) => !t.githubIssueNumber);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">GitHub Sync</h1>
        <p className="mt-1 text-sm text-white/40">
          Sync marketing tasks with GitHub Issues
        </p>
      </div>

      <div className="mb-6">
        <GithubSyncButton />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="glass rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Sync Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">
                    Synced to GitHub
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {syncedTasks.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Pending sync</span>
                  <span className="text-lg font-bold text-amber-400">
                    {unSyncedTasks.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">
                    Total marketing tasks
                  </span>
                  <span className="text-lg font-bold text-white">
                    {tasks.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Configuration
              </h2>
              <p className="text-xs text-white/40 mb-4">
                GitHub sync uses environment variables. Configure them in
                Doppler.
              </p>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                    Repo Owner
                  </span>
                  <p className="text-sm text-white/60">
                    {process.env.NEXT_PUBLIC_GITHUB_MARKETING_REPO_OWNER || "Not configured"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                    Repo Name
                  </span>
                  <p className="text-sm text-white/60">
                    {process.env.NEXT_PUBLIC_GITHUB_MARKETING_REPO_NAME || "Not configured"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {team.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-white/40">
                Marketing Team
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {team.map((member) => (
                  <div
                    key={member.id}
                    className="glass rounded-lg p-4 text-center"
                  >
                    <div
                      className="mx-auto h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor:
                          member.color === "cyan"
                            ? "rgba(6,182,212,0.2)"
                            : member.color === "purple"
                              ? "rgba(139,92,246,0.2)"
                              : member.color === "emerald"
                                ? "rgba(16,185,129,0.2)"
                                : member.color === "amber"
                                  ? "rgba(245,158,11,0.2)"
                                  : "rgba(244,63,94,0.2)",
                        color:
                          member.color === "cyan"
                            ? "var(--color-cyan)"
                            : member.color === "purple"
                              ? "var(--color-purple)"
                              : member.color === "emerald"
                                ? "var(--color-emerald)"
                                : member.color === "amber"
                                  ? "var(--color-amber)"
                                  : "#f43f5e",
                      }}
                    >
                      {member.initials}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">
                      {member.name}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                      {member.role}
                    </p>
                    {member.focus && (
                      <p className="mt-1 text-[10px] text-white/30">
                        {member.focus}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
