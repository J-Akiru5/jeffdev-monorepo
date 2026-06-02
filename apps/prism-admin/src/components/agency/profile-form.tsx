"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@syntaxure/ui";
import { updateAgencyUserProfile } from "@/app/actions/agency-users";
import { uploadToStorage } from "@/app/actions/storage";
import type { UserProfile } from "@/app/actions/agency-users";

/**
 * Profile Form Component
 * -----------------------
 * Edit user profile settings with avatar upload.
 */

interface Props {
  profile: UserProfile | null;
  uid: string;
}

export function ProfileForm({ profile, uid }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    displayName: profile?.displayName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    title: profile?.title || "",
    location: profile?.location || "",
    timezone: profile?.timezone || "UTC",
    photoURL: profile?.photoURL || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await updateAgencyUserProfile(uid, form);
    if (result.success) {
      setSuccess(true);
      router.refresh();
    } else {
      setError(result.error || "Failed to update profile");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Profile updated successfully
        </div>
      )}

      {/* Avatar Upload */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Profile Photo</h3>
        <ImageUpload
          currentImage={form.photoURL || null}
          onUpload={async (file) => {
            const result = await uploadToStorage(file, "avatars");
            if (result.success && result.url) {
              setForm((f) => ({ ...f, photoURL: result.url! }));
              return { url: result.url };
            }
            return { url: "", error: result.error };
          }}
          onRemove={async () => {
            setForm((f) => ({ ...f, photoURL: "" }));
            return { success: true };
          }}
          label="Upload Photo"
          previewHeight="h-40"
          crop={true}
          cropAspect={1}
        />
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Personal Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Display Name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Lead Developer"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">About</h3>
        <div>
          <label className="block text-xs text-white/50 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (US)</option>
              <option value="America/Chicago">Central (US)</option>
              <option value="America/Denver">Mountain (US)</option>
              <option value="America/Los_Angeles">Pacific (US)</option>
              <option value="Asia/Manila">Philippines (PHT)</option>
              <option value="Asia/Tokyo">Japan (JST)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
