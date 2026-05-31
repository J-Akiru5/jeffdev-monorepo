"use client";

/**
 * Workspace Members Settings
 * ---------------------------
 * Lists all workspace members with role badges.
 * Founders can: change roles, assign departments, remove members.
 * Uses server actions for all mutations.
 */

import { useState, useOptimistic, startTransition, useMemo } from "react";
import { Users, Shield, ShieldOff, Trash2, Building2, UserMinus, Loader2, AlertTriangle, GitBranch } from "lucide-react";
import { ConfirmDialog } from "@syntaxure/ui";
import { updateMemberRole, assignMemberDepartment, removeMember } from "@/app/actions/members";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useManageModeStore } from "@/stores/manage-mode-store";
import { toast } from "sonner";

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
  const manageMode = useManageModeStore((s) => s.mode);
  const isFounder = userRole === "founder";
  const canManageMembers = isFounder && manageMode === "workspace";
  const isCLevelScoped = cLevelTitle !== null && cLevelTitle !== "ceo";

  // C-Level scoping: only show members in the user's department if scoped
  const cLevelDeptName = useMemo(
    () =>
      cLevelTitle
        ? ({ ceo: null, cto: "Engineering", cpo: "Product", coo: "Operations", cmo: "Marketing" } as const)[
            cLevelTitle
          ]
        : null,
    [cLevelTitle],
  );
  const cLevelDepartmentId = useMemo(
    () =>
      cLevelDeptName
        ? departments.find((d) => d.name === cLevelDeptName)?.id ?? null
        : null,
    [cLevelDeptName, departments],
  );

  const [optimisticMembers, setOptimisticMembers] = useState(members);

  const filteredMembers = useMemo(
    () =>
      isCLevelScoped && cLevelDepartmentId
        ? optimisticMembers.filter(
            (m) =>
              m.departmentId === cLevelDepartmentId ||
              m.userId === currentUserId,
          )
        : optimisticMembers,
    [isCLevelScoped, cLevelDepartmentId, optimisticMembers, currentUserId],
  );
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null);

  const handleRoleChange = async (userId: string, newRole: "founder" | "employee") => {
    setLoadingMap((prev) => ({ ...prev, [`role-${userId}`]: true }));

    startTransition(() => {
      setOptimisticMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
    });

    const result = await updateMemberRole(workspaceId, userId, newRole, manageMode);
    if (result.error) {
      // Revert on error
      setOptimisticMembers(members);
    }
    setLoadingMap((prev) => ({ ...prev, [`role-${userId}`]: false }));
  };

  const handleDepartmentChange = async (userId: string, departmentId: string | null) => {
    setLoadingMap((prev) => ({ ...prev, [`dept-${userId}`]: true }));
    const result = await assignMemberDepartment(workspaceId, userId, departmentId, manageMode);
    if (result.error) {
      alert(result.error);
    }
    setLoadingMap((prev) => ({ ...prev, [`dept-${userId}`]: false }));
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    setConfirmRemove({ userId, name });
  };

  const executeRemoveMember = async (userId: string, name: string) => {
    setConfirmRemove(null);
    setLoadingMap((prev) => ({ ...prev, [`remove-${userId}`]: true }));

    startTransition(() => {
      setOptimisticMembers((prev) => prev.filter((m) => m.userId !== userId));
    });

    const result = await removeMember(workspaceId, userId, manageMode);
    if (result.error) {
      setOptimisticMembers(members);
      toast.error(result.error);
    } else {
      toast.success(`${name} removed from workspace`);
    }
    setLoadingMap((prev) => ({ ...prev, [`remove-${userId}`]: false }));
  };

  return (
    <>
      <ConfirmDialog
        open={confirmRemove !== null}
        onOpenChange={() => setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.name || "member"}?`}
        description="They will lose access to all workspace resources. This action cannot be undone."
        confirmLabel="Remove"
        confirmVariant="danger"
        icon={AlertTriangle}
        onConfirm={() => {
          if (confirmRemove) {
            executeRemoveMember(confirmRemove.userId, confirmRemove.name);
          }
        }}
      />
      <section className="rounded-xl border border-white/[0.10] glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-purple-500/10 p-3">
          <Users className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Workspace Members</h2>
          <p className="mt-1 text-sm text-white/40">
            Manage roles and department assignments
            {!canManageMembers && isFounder && (
              <span className="block mt-1 italic text-amber-400/60">
                <GitBranch className="inline h-3 w-3 mr-1" />
                Switch to <strong>Workspace</strong> mode to edit members
              </span>
            )}
            {!isFounder && <span className="block mt-1 italic">(Only founders can edit members)</span>}
          </p>

          {isCLevelScoped && cLevelDeptName && (
            <p className="mt-2 text-xs text-white/50">
              Showing members in <strong className="text-white/70">{cLevelDeptName}</strong> (your C-Level scope).
            </p>
          )}

          {filteredMembers.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">No members found.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isLoadingRole = loadingMap[`role-${member.userId}`];
                const isLoadingDept = loadingMap[`dept-${member.userId}`];

                return (
                  <div
                    key={member.userId}
                    className={`rounded-lg border border-white/[0.10] px-4 py-3 transition-all ${
                      isCurrentUser ? "border-cyan-500/20 bg-cyan-500/5" : "bg-white/[0.02]"
                    }`}
                  >
                    {/* Member info + controls — stack vertically on small screens */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.10] text-xs font-medium text-white/70">
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
                          <p className="text-sm font-medium text-white truncate">
                            {member.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] text-white/40 font-mono uppercase">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-white/40 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* Role Badge / Changer */}
                      {canManageMembers && !isCurrentUser ? (
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
                            <Loader2 className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-white/40" />
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

                      {/* Department Assignment (Workspace mode + Founder only) */}
                      {canManageMembers && !isCurrentUser && departments.length > 0 && (
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
                            className="appearance-none rounded-md border border-white/[0.10] bg-white/[0.02] px-2 py-1 text-xs text-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                          >
                            <option value="">No dept.</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                          {isLoadingDept && (
                            <Loader2 className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-white/40" />
                          )}
                        </div>
                      )}

                      {/* Remove Button (Workspace mode + Founder only, not yourself) */}
                      {canManageMembers && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.name)}
                          disabled={loadingMap[`remove-${member.userId}`]}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  );
}
