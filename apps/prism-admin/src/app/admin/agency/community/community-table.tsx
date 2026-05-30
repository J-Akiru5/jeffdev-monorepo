"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Trash2,
  MessageSquare,
  User,
  Filter,
} from "lucide-react";
import { cn } from "@syntaxure/ui";
import { deleteCommunityMember, CommunityMember } from "@/app/actions/community";

const roleColors: Record<string, { bg: string; text: string; label: string }> = {
  developer: {
    bg: "bg-cyan-500/10 border-cyan-500/20",
    text: "text-cyan-400",
    label: "Developer",
  },
  founder: {
    bg: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-400",
    label: "Founder / CEO",
  },
  cto: {
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400",
    label: "CTO / Lead",
  },
  designer: {
    bg: "bg-pink-500/10 border-pink-500/20",
    text: "text-pink-400",
    label: "Designer",
  },
  researcher: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400",
    label: "AI Researcher",
  },
  other: {
    bg: "bg-white/5 border-white/10",
    text: "text-white/60",
    label: "Other",
  },
};

export function CommunityTable({ members }: { members: CommunityMember[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the community?`)) return;
    setDeleting(id);
    const result = await deleteCommunityMember(id);
    setDeleting(null);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to remove community member.");
    }
  };

  // Filtering logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.github_username && member.github_username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.discord_handle && member.discord_handle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRole === "all" ||
      member.primary_role?.toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] py-16">
        <Users className="h-10 w-10 text-white/20" />
        <p className="mt-4 text-sm text-white/40">No registered community members yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, GitHub or Discord..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/5 bg-white/[0.02] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/40 focus:bg-white/[0.04] focus:outline-none transition-all"
          />
        </div>

        {/* Role Selector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white/70 focus:border-amber-500/40 focus:outline-none font-mono"
          >
            <option value="all" className="bg-[#0f0f0f]">All Roles</option>
            <option value="developer" className="bg-[#0f0f0f]">Developer</option>
            <option value="founder" className="bg-[#0f0f0f]">Founder / CEO</option>
            <option value="cto" className="bg-[#0f0f0f]">CTO / Lead</option>
            <option value="designer" className="bg-[#0f0f0f]">Designer</option>
            <option value="researcher" className="bg-[#0f0f0f]">Researcher</option>
            <option value="other" className="bg-[#0f0f0f]">Other</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto rounded-md border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Member Info
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Primary Role
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Social Accounts
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Interests / Project
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Joined Date
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/30">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/20 font-mono">
                  No matching results found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const roleConfig = (roleColors[member.primary_role || "other"] || roleColors.other) as { bg: string; text: string; label: string };
                return (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Member Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.02] border border-white/5">
                          <User className="h-4 w-4 text-white/40" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {member.full_name}
                          </div>
                          <div className="text-xs text-white/40 font-mono">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider",
                          roleConfig.bg,
                          roleConfig.text
                        )}
                      >
                        {roleConfig.label}
                      </span>
                    </td>

                    {/* Handles */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {member.github_username ? (
                          <div className="flex items-center gap-1.5 text-xs text-white/60">
                            <svg className="h-3.5 w-3.5 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <a
                              href={`https://github.com/${member.github_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-cyan-400 transition-colors font-mono"
                            >
                              @{member.github_username}
                            </a>
                          </div>
                        ) : null}
                        {member.discord_handle ? (
                          <div className="flex items-center gap-1.5 text-xs text-white/60">
                            <MessageSquare className="h-3.5 w-3.5 text-white/30" />
                            <span className="font-mono">{member.discord_handle}</span>
                          </div>
                        ) : null}
                        {!member.github_username && !member.discord_handle && (
                          <span className="text-xs text-white/20 font-mono">—</span>
                        )}
                      </div>
                    </td>

                    {/* Interests */}
                    <td className="px-4 py-3 max-w-xs">
                      {member.interests ? (
                        <p className="text-xs text-white/60 line-clamp-2" title={member.interests}>
                          {member.interests}
                        </p>
                      ) : (
                        <span className="text-xs text-white/20 font-mono">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(member.id, member.full_name)}
                        disabled={deleting === member.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
