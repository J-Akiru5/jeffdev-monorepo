"use client";

import { useState } from "react";
import { X, Mail, Copy, Check } from "lucide-react";
import { inviteCommunityMember } from "@/app/actions/community";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email || !name) return;
    setLoading(true);
    setError(null);

    try {
      const result = await inviteCommunityMember(email, name);
      if (result.success && result.token) {
        setInviteToken(result.token);
      } else {
        setError(result.error || "Failed to create invite");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/community/join?token=${inviteToken}`
    : "";

  const handleCopy = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setInviteToken(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Mail className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Invite Member</h2>
              <p className="text-xs text-white/40">Send an invitation link to join the community</p>
            </div>
          </div>
        </div>

        {inviteToken ? (
          /* Success State */
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Invitation created successfully!
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                Invitation Link
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/30">
                This link expires in 7 days. Share it with {name} to join the community.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-md bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                Name <span className="text-amber-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                Email <span className="text-amber-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                placeholder="john@example.com"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleClose}
                className="rounded-md bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={loading || !email || !name}
                className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Invite Link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
