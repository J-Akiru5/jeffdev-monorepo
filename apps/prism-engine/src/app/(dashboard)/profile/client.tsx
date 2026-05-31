"use client";

/**
 * Profile Page Client Component
 * ------------------------------
 * Form for editing profile display name and avatar.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";

interface Props {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

export function ProfilePageClient({ userId, email, displayName, avatarUrl }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatar,
        },
      });

      if (updateError) throw updateError;
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar upload */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Profile Photo</h2>
        <ImageUpload
          currentImage={avatar}
          onUpload={async (file) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { url: "", error: "Not authenticated" };

            const ext = file.name.split(".").pop() || "png";
            const fileName = `${user.id}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(fileName, file, { upsert: true, contentType: file.type });

            if (uploadError) return { url: "", error: uploadError.message };

            const { data: { publicUrl } } = supabase.storage
              .from("avatars")
              .getPublicUrl(fileName);

            setAvatar(publicUrl);
            return { url: publicUrl };
          }}
          onRemove={async () => {
            setAvatar(null);
            return { success: true };
          }}
          previewHeight="h-40"
        />
      </div>

      {/* Display name */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Personal Info</h2>

        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1">Email</label>
          <p className="text-sm text-[var(--text-secondary)]">{email}</p>
        </div>

        <div>
          <label htmlFor="display-name" className="block text-xs text-[var(--text-tertiary)] mb-1">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-quiet)] focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Actions */}
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

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50 transition-all active:scale-[0.97]"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
