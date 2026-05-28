"use client";

import { useState } from "react";
import { Shield, UserMinus, UserCog } from "lucide-react";
import {
  adminUpdateMemberRole,
  adminAssignDepartment,
  adminRemoveMember,
} from "@/app/actions/manage";

interface Member {
  userId: string;
  role: string;
  departmentId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Props {
  workspaceId: string;
  workspaceName: string;
  members: Member[];
  departments: Department[];
}

export function WorkspaceMembersManager({
  workspaceId,
  workspaceName,
  members: initialMembers,
  departments,
}: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleRoleToggle(
    userId: string,
    currentRole: string,
  ) {
    const newRole = currentRole === "founder" ? "employee" : "founder";
    const result = await adminUpdateMemberRole(workspaceId, userId, newRole);

    if (result.success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, role: newRole } : m,
        ),
      );
      setMessage({ type: "success", text: `Role updated to ${newRole}` });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update role" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDepartmentChange(
    userId: string,
    departmentId: string,
  ) {
    const result = await adminAssignDepartment(
      workspaceId,
      userId,
      departmentId || null,
    );

    if (result.success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, departmentId: departmentId || null } : m,
        ),
      );
    } else {
      setMessage({ type: "error", text: result.error || "Failed to assign department" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from ${workspaceName}?`)) return;
    const result = await adminRemoveMember(workspaceId, userId);

    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setMessage({ type: "success", text: `${name} removed from workspace` });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to remove member" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
      {message && (
        <div
          className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <UserCog className="h-4 w-4 text-cyan-400" />
          Member Management
        </h3>
      </div>

      <div className="divide-y divide-white/5">
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/30">
            No members in this workspace
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{member.name}</p>
                <p className="text-xs text-white/40 truncate">{member.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={member.departmentId || ""}
                  onChange={(e) =>
                    handleDepartmentChange(member.userId, e.target.value)
                  }
                  className="h-8 rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white/70 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    handleRoleToggle(member.userId, member.role)
                  }
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                    member.role === "founder"
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  }`}
                  title="Toggle role"
                >
                  <Shield className="h-3 w-3" />
                  {member.role}
                </button>

                <button
                  onClick={() => handleRemove(member.userId, member.name)}
                  className="rounded p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove from workspace"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
