"use client";

/**
 * Workspace Members Settings
 * ---------------------------
 * Lists all workspace members with role badges.
 * Founders can: change roles, assign departments, remove members.
 * Uses server actions for all mutations.
 */

import { useState, useOptimistic, startTransition } from "react";
import { Users, Shield, ShieldOff, Trash2, Building2, UserMinus, Loader2 } from "lucide-react";
import { updateMemberRole, assignMemberDepartment, removeMember } from "@/app/actions/members";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface Member {
  userId: string;
  role: string;
  departmentId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface WorkspaceMembersProps {
  members: Member[];
  workspaceId: string;
  currentUserId: string;
}

export function WorkspaceMembersSettings({
  members,
  workspaceId,
  currentUserId,
}: WorkspaceMembersProps) {
  const departments = useWorkspaceStore((s) => s.departments);
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const isFounder = userRole === "founder";
  const isCLevelScoped = cLevelTitle !== null && cLevelTitle !== "ceo";

  // C-Level scoping: only show members in the user's department if scoped
  const cLevelDeptName = cLevelTitle
    ? ({ ceo: null, cto: "Engineering", cpo: "Product", coo: "Operations", cmo: "Marketing" } as const)[cLevelTitle]
    : null;
  const cLevelDepartmentId = cLevelDeptName
    ? departments.find((d) => d.name === cLevelDeptName)?.id ?? null
    : null;

  const [optimisticMembers, setOptimisticMembers] = useState(members);

  const filteredMembers = isCLevelScoped && cLevelDepartmentId
    ? optimisticMembers.filter((m) => m.departmentId === cLevelDepartmentId || m.userId === currentUserId)
    : optimisticMembers;
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleRoleChange = async (userId: string, newRole: "founder" | "employee") => {
    setLoadingMap((prev) => ({ ...prev, [`role-${userId}`]: true }));

    startTransition(() => {
      setOptimisticMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
    });

    const result = await updateMemberRole(workspaceId, userId, newRole);
    if (result.error) {
      // Revert on error
      setOptimisticMembers(members);
    }
    setLoadingMap((prev) => ({ ...prev, [`role-${userId}`]: false }));
  };

  const handleDepartmentChange = async (userId: string, departmentId: string | null) => {
    setLoadingMap((prev) => ({ ...prev, [`dept-${userId}`]: true }));
    const result = await assignMemberDepartment(workspaceId, userId, departmentId);
    if (result.error) {
      alert(result.error);
    }
    setLoadingMap((prev) => ({ ...prev, [`dept-${userId}`]: false }));
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    setLoadingMap((prev) => ({ ...prev, [`remove-${userId}`]: true }));

    startTransition(() => {
      setOptimisticMembers((prev) => prev.filter((m) => m.userId !== userId));
    });

    const result = await removeMember(workspaceId, userId);
    if (result.error) {
      setOptimisticMembers(members);
      alert(result.error);
    }
    setLoadingMap((prev) => ({ ...prev, [`remove-${userId}`]: false }));
  };

  return (
    <section className="rounded-xl border border-glass-10 glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-purple-500/10 p-3">
          <Users className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary">Workspace Members</h2>
          <p className="mt-1 text-sm text-text-muted">
            Manage roles and department assignments
            {!isFounder && <span className="block mt-1 italic">(Only founders can edit members)</span>}
          </p>

          {isCLevelScoped && cLevelDeptName && (
            <p className="mt-2 text-xs text-text-tertiary">
              Showing members in <strong className="text-text-secondary">{cLevelDeptName}</strong> (your C-Level scope).
            </p>
          )}

          {filteredMembers.length === 0 ? (
            <p className="mt-4 text-sm text-text-tertiary">No members found.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isLoadingRole = loadingMap[`role-${member.userId}`];
                const isLoadingDept = loadingMap[`dept-${member.userId}`];

                return (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between rounded-lg border border-glass-10 px-4 py-3 transition-all ${
                      isCurrentUser ? "border-cyan-500/20 bg-cyan-500/5" : "bg-elevated/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-glass-10 text-xs font-medium text-text-secondary">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {member.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] text-text-muted font-mono uppercase">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Role Badge / Changer */}
                      {isFounder && !isCurrentUser ? (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.userId, e.target.value as "founder" | "employee")
                            }
                            disabled={isLoadingRole}
                            className={`appearance-none rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                              member.role === "founder"
                                ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                            } focus:outline-none focus:ring-1 focus:ring-cyan-500/50`}
                          >
                            <option value="founder">Founder</option>
                            <option value="employee">Employee</option>
                          </select>
                          {isLoadingRole && (
                            <Loader2 className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-text-muted" />
                          )}
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                            member.role === "founder"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-cyan-500/10 text-cyan-400"
                          }`}
                        >
                          {member.role === "founder" ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                          {member.role === "founder" ? "Founder" : "Employee"}
                        </span>
                      )}

                      {/* Department Assignment (Founders only) */}
                      {isFounder && !isCurrentUser && departments.length > 0 && (
                        <div className="relative">
                          <select
                            value={member.departmentId || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleDepartmentChange(
                                member.userId,
                                val || null
                              );
                            }}
                            disabled={isLoadingDept}
                            className="appearance-none rounded-md border border-glass-10 bg-elevated/50 px-2 py-1 text-xs text-text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                          >
                            <option value="">No dept.</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                          {isLoadingDept && (
                            <Loader2 className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-text-muted" />
                          )}
                        </div>
                      )}

                      {/* Remove Button (Founders only, not yourself) */}
                      {isFounder && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.name)}
                          disabled={loadingMap[`remove-${member.userId}`]}
                          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          title="Remove from workspace"
                        >
                          {loadingMap[`remove-${member.userId}`] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
