"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { createAgencyInvite } from "@/app/actions/agency-users";

/**
 * Invite Modal Component
 * -----------------------
 * Modal for inviting team members.
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invitedBy: string;
}

export function InviteModal({ isOpen, onClose, invitedBy }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await createAgencyInvite({
      email,
      role,
      invitedBy,
      projectName: projectName || undefined,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setEmail("");
        setRole("employee");
        setProjectName("");
        setSuccess(false);
      }, 1500);
    } else {
      setError(result.error || "Failed to create invite");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              Invite sent successfully!
            </div>
          )}

          <div>
            <label className="block text-xs text-white/50 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="admin">Admin</option>
              <option value="partner">Partner</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Project (optional)</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
