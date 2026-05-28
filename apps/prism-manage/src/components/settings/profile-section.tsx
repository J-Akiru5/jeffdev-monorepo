"use client";

/**
 * Profile Section
 * ---------------
 * Account settings section showing user profile info.
 * Founders can set/edit their C-Level title (CEO, CTO, CPO, COO, CMO).
 * Requires a server action to persist the change.
 */

import { useState } from "react";
import { User, Shield, BadgeCheck, Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CLevelTitle } from "@/lib/schemas";

interface ProfileSectionProps {
  userName: string;
  userEmail: string;
  workspaceId: string;
}

const C_LEVEL_OPTIONS: { value: CLevelTitle; label: string; department: string; description: string }[] = [
  { value: "ceo", label: "CEO", department: "Executive", description: "Company-wide dashboard & all departments" },
  { value: "cto", label: "CTO", department: "Engineering", description: "Engineering dashboard & department members" },
  { value: "cpo", label: "CPO", department: "Product", description: "Product dashboard & task approval" },
  { value: "coo", label: "COO", department: "Operations", description: "Operations dashboard & department members" },
  { value: "cmo", label: "CMO", department: "Marketing", description: "Marketing dashboard & department members" },
];

export function ProfileSection({ userName, userEmail, workspaceId }: ProfileSectionProps) {
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const setCLevelTitle = useWorkspaceStore((s) => s.setCLevelTitle);
  const isFounder = userRole === "founder";

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<CLevelTitle | null>(cLevelTitle);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/workspace/update-c-level-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, cLevelTitle: selected }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }

      setCLevelTitle(selected);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-glass-10 glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-glass-10 p-3">
          <User className="h-6 w-6 text-text-secondary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary">Account</h2>
          <p className="mt-1 text-sm text-text-muted">
            Manage your account details and role.
          </p>

          <div className="mt-4 space-y-4">
            {/* Name & Email (read-only display) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  Name
                </label>
                <p className="text-sm text-text-primary">{userName}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  Email
                </label>
                <p className="text-sm text-text-primary">{userEmail}</p>
              </div>
            </div>

            {/* Role badge */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                Role
              </label>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                  isFounder
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-cyan-500/10 text-cyan-400"
                }`}
              >
                {isFounder ? (
                  <Shield className="h-3.5 w-3.5" />
                ) : (
                  <BadgeCheck className="h-3.5 w-3.5" />
                )}
                {isFounder ? "Founder" : "Employee"}
              </span>
            </div>

            {/* C-Level Title Editor — founder only */}
            {isFounder && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  C-Level Title
                </label>
                <p className="mb-3 text-xs text-text-tertiary">
                  Refine your founder permissions. This scopes your sidebar and
                  member management to a specific department. Set to{" "}
                  <strong className="text-text-secondary">none</strong> for
                  unrestricted access.
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {/* "None" option */}
                  <button
                    onClick={() => setSelected(null)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                      selected === null
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                        : "border-glass-10 text-text-tertiary hover:border-border-active hover:text-text-secondary"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-glass-10 text-xs font-bold text-text-muted">
                      —
                    </span>
                    <div>
                      <span className="font-medium">None</span>
                      <p className="text-[11px] text-text-quiet">
                        Full founder access
                      </p>
                    </div>
                  </button>

                  {C_LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelected(opt.value)}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                        selected === opt.value
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                          : "border-glass-10 text-text-tertiary hover:border-border-active hover:text-text-secondary"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          selected === opt.value
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-glass-10 text-text-muted"
                        }`}
                      >
                        {opt.label.slice(0, 2)}
                      </span>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <p className="text-[11px] text-text-quiet">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Save button */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || selected === cLevelTitle}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#050505] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </button>
                  {error && (
                    <span className="text-xs text-red-400">{error}</span>
                  )}
                  {success && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Updated
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
