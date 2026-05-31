"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  createCommunityMember,
  updateCommunityMember,
  type CommunityMember,
  type CommunityMemberInput,
} from "@/app/actions/community";

interface CommunityMemberFormProps {
  initialData?: CommunityMember;
  mode: "create" | "edit";
}

interface MemberFormState {
  email: string;
  full_name: string;
  github_username: string;
  discord_handle: string;
  primary_role: string;
  interests: string;
}

const DEFAULT_FORM: MemberFormState = {
  email: "",
  full_name: "",
  github_username: "",
  discord_handle: "",
  primary_role: "",
  interests: "",
};

function toFormState(data: CommunityMember): MemberFormState {
  return {
    email: data.email,
    full_name: data.full_name,
    github_username: data.github_username ?? "",
    discord_handle: data.discord_handle ?? "",
    primary_role: data.primary_role ?? "",
    interests: data.interests ?? "",
  };
}

function toPayload(form: MemberFormState): CommunityMemberInput {
  return {
    email: form.email,
    full_name: form.full_name,
    github_username: form.github_username || null,
    discord_handle: form.discord_handle || null,
    primary_role: form.primary_role || null,
    interests: form.interests || null,
  };
}

const roleOptions = [
  { value: "developer", label: "Developer" },
  { value: "founder", label: "Founder / CEO" },
  { value: "cto", label: "CTO / Lead" },
  { value: "designer", label: "Designer" },
  { value: "researcher", label: "AI Researcher" },
  { value: "other", label: "Other" },
];

export function CommunityMemberForm({ initialData, mode }: CommunityMemberFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<MemberFormState>(
    initialData ? toFormState(initialData) : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = toPayload(form);
      const id = initialData && mode === "edit" ? initialData.id : undefined;

      const result = id
        ? await updateCommunityMember(id, payload)
        : await createCommunityMember(payload);

      if (result.success) {
        setMessage({
          type: "success",
          text: mode === "edit" ? "Member updated." : "Member created.",
        });
        setTimeout(() => router.push("/admin/agency/community"), 1000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/agency/community"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {mode === "edit" ? "Edit Member" : "Add Member"}
          </h1>
          <p className="text-sm text-white/50">
            {mode === "edit" ? "Update member details" : "Add a new community member"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form.email || !form.full_name}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : mode === "edit" ? "Update Member" : "Add Member"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Basic Information
        </h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <input
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Email <span className="text-amber-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Primary Role</label>
            <select
              value={form.primary_role}
              onChange={(e) => setForm((prev) => ({ ...prev, primary_role: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
            >
              <option value="" className="bg-[#030303]">
                Select a role
              </option>
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value} className="bg-[#030303]">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Social Links
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">GitHub Username</label>
            <input
              value={form.github_username}
              onChange={(e) => setForm((prev) => ({ ...prev, github_username: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
              placeholder="octocat"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Discord Handle</label>
            <input
              value={form.discord_handle}
              onChange={(e) => setForm((prev) => ({ ...prev, discord_handle: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
              placeholder="user#1234"
            />
          </div>
        </div>
      </section>

      {/* Interests */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Interests
        </h2>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Interests / Projects</label>
          <textarea
            value={form.interests}
            onChange={(e) => setForm((prev) => ({ ...prev, interests: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none resize-y"
            placeholder="What are they working on or interested in?"
          />
        </div>
      </section>

      {/* Bottom Save */}
      <div className="flex justify-end border-t border-white/5 pt-6">
        <button
          onClick={handleSave}
          disabled={saving || !form.email || !form.full_name}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : mode === "edit" ? "Update Member" : "Add Member"}
        </button>
      </div>
    </div>
  );
}
