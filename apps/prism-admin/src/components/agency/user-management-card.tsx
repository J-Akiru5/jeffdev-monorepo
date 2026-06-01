"use client";

/**
 * UserManagementCard
 * ------------------
 * Interactive card for managing a single user's role and status.
 * Used in the users and access control pages.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAgencyUserRole, deactivateAgencyUser } from "@/app/actions/agency-users";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  UserX,
  Check,
  X,
} from "lucide-react";

const ROLES = [
  { value: "founder", label: "Founder", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "admin", label: "Admin", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { value: "partner", label: "Partner", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "employee", label: "Employee", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
] as const;

const roleIcons: Record<string, React.ReactNode> = {
  founder: <ShieldCheck className="h-4 w-4 text-amber-400" />,
  admin: <Shield className="h-4 w-4 text-cyan-400" />,
  partner: <Shield className="h-4 w-4 text-emerald-400" />,
  employee: <ShieldAlert className="h-4 w-4 text-purple-400" />,
};

interface UserManagementCardProps {
  uid: string;
  name: string;
  email: string;
  currentRole: string;
  compact?: boolean;
}

export function UserManagementCard({
  uid,
  name,
  email,
  currentRole,
  compact = false,
}: UserManagementCardProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeactivate, setShowDeactivate] = useState(false);

  const roleConfig = ROLES.find((r) => r.value === role) || ROLES[3];

  async function handleRoleChange(newRole: string) {
    if (newRole === role) {
      setEditing(false);
      return;
    }
    setLoading(true);
    setError("");
    const result = await updateAgencyUserRole(uid, newRole);
    if (result.success) {
      setRole(newRole);
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error || "Failed to update role");
    }
    setLoading(false);
  }

  async function handleDeactivate() {
    setLoading(true);
    setError("");
    const result = await deactivateAgencyUser(uid);
    if (result.success) {
      setShowDeactivate(false);
      router.refresh();
    } else {
      setError(result.error || "Failed to deactivate user");
    }
    setLoading(false);
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
          {roleIcons[role] || <ShieldAlert className="h-4 w-4 text-white/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{name || "Unnamed"}</p>
          <p className="text-xs text-white/40 truncate">{email}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setEditing(!editing)}
            disabled={loading}
            className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider border transition-colors hover:opacity-80 ${roleConfig.color}`}
          >
            {role}
            <ChevronDown className="inline h-3 w-3 ml-1" />
          </button>
          {editing && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-white/10 bg-[#0c0c0c] py-1 shadow-2xl shadow-black/50">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRoleChange(r.value)}
                  disabled={loading}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
                    r.value === role ? "text-white" : "text-white/60"
                  }`}
                >
                  {roleIcons[r.value]}
                  <span className="flex-1 text-left">{r.label}</span>
                  {r.value === role && <Check className="h-3 w-3 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
            {name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{name || "Unnamed"}</p>
            <p className="text-xs text-white/40">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role dropdown */}
          <div className="relative">
            <button
              onClick={() => setEditing(!editing)}
              disabled={loading}
              className={`flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider border transition-colors hover:opacity-80 ${roleConfig.color}`}
            >
              {roleIcons[role]}
              {role}
              <ChevronDown className={`h-3 w-3 transition-transform ${editing ? "rotate-180" : ""}`} />
            </button>
            {editing && (
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-white/10 bg-[#0c0c0c] py-1 shadow-2xl shadow-black/50">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleRoleChange(r.value)}
                    disabled={loading}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
                      r.value === role ? "text-white" : "text-white/60"
                    }`}
                  >
                    {roleIcons[r.value]}
                    <span className="flex-1 text-left">{r.label}</span>
                    {r.value === role && <Check className="h-3 w-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Deactivate button */}
          {role !== "founder" && (
            <div className="relative">
              <button
                onClick={() => setShowDeactivate(!showDeactivate)}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                title="Deactivate user"
              >
                <UserX className="h-4 w-4" />
              </button>
              {showDeactivate && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/10 bg-[#0c0c0c] p-3 shadow-2xl shadow-black/50">
                  <p className="text-xs text-white/60 mb-3">
                    Deactivate {name}? They will be unable to sign in for 24 hours.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeactivate(false)}
                      className="flex-1 rounded-md border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeactivate}
                      disabled={loading}
                      className="flex-1 rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                    >
                      {loading ? "..." : "Deactivate"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
