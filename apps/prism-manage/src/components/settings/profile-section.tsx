"use client";

/**
 * Profile Section
 * ---------------
 * Account settings with editable profile fields, avatar upload,
 * change password, C-Level title refinement, and cross-app sync.
 */

import { useState, useRef } from "react";
import {
  User,
  Shield,
  BadgeCheck,
  Loader2,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  ExternalLink,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/browser";
import { updateProfile, changePassword, updateAvatarUrl } from "@/app/actions/profile";
import type { CLevelTitle } from "@/lib/schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileSectionProps {
  userName: string;
  userEmail: string;
  workspaceId: string;
  userBio?: string | null;
  userCompany?: string | null;
  userPhone?: string | null;
  userTimezone?: string | null;
  userAvatarUrl?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const C_LEVEL_OPTIONS: {
  value: CLevelTitle;
  label: string;
  department: string;
  description: string;
}[] = [
  { value: "ceo", label: "CEO", department: "Executive", description: "Company-wide dashboard & all departments" },
  { value: "cto", label: "CTO", department: "Engineering", description: "Engineering dashboard & department members" },
  { value: "cpo", label: "CPO", department: "Product", description: "Product dashboard & task approval" },
  { value: "coo", label: "COO", department: "Operations", description: "Operations dashboard & department members" },
  { value: "cmo", label: "CMO", department: "Marketing", description: "Marketing dashboard & department members" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileSection({
  userName,
  userEmail,
  workspaceId,
  userBio,
  userCompany,
  userPhone,
  userTimezone,
  userAvatarUrl,
}: ProfileSectionProps) {
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const setCLevelTitle = useWorkspaceStore((s) => s.setCLevelTitle);
  const isFounder = userRole === "founder";

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile fields ──
  const [fullName, setFullName] = useState(userName);
  const [bio, setBio] = useState(userBio || "");
  const [company, setCompany] = useState(userCompany || "");
  const [phone, setPhone] = useState(userPhone || "");
  const [timezone, setTimezone] = useState(userTimezone || "UTC");

  // ── Password fields ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // ── C-Level ──
  const [selected, setSelected] = useState<CLevelTitle | null>(cLevelTitle);

  // ── UI state ──
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [cLevelSaving, setCLevelSaving] = useState(false);
  const [cLevelError, setCLevelError] = useState<string | null>(null);
  const [cLevelSuccess, setCLevelSuccess] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userAvatarUrl || null);

  // ── Password strength ──
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-white/10" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    const colors = ["bg-white/10", "bg-red-500", "bg-yellow-500", "bg-cyan-500", "bg-emerald-500"];
    return { score, label: labels[score] || "", color: colors[score] || "bg-white/10" };
  };

  const pwStrength = getPasswordStrength(newPassword);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8 && passwordsMatch && newPassword !== currentPassword;

  // ── Handlers ──

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    const result = await updateProfile({
      fullName,
      bio,
      companyName: company,
      phone,
      timezone,
    });

    if (result.error) {
      setProfileError(result.error);
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordsMatch) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    const result = await changePassword(currentPassword, newPassword);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setPasswordSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be under 2MB");
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        // Provide helpful guidance based on error type
        const msg = uploadError.message?.toLowerCase() || "";
        if (msg.includes("bucket") && msg.includes("not found")) {
          throw new Error(
            "Avatar storage is not configured. Please ask your admin to create an 'avatars' bucket in Supabase Storage."
          );
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update local preview
      setAvatarPreview(publicUrl);

      // Save to user_profiles via server action
      const result = await updateAvatarUrl(publicUrl);
      if (result.error) throw new Error(result.error);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarPreview(null);
    setAvatarError(null);
    const result = await updateAvatarUrl(null);
    if (result.error) setAvatarError(result.error);
  };

  const handleCLevelSave = async () => {
    setCLevelSaving(true);
    setCLevelError(null);
    setCLevelSuccess(false);

    try {
      const res = await fetch("/api/workspace/update-c-level-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, cLevelTitle: selected }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCLevelError(data.error || "Failed to update");
        return;
      }

      setCLevelTitle(selected);
      setCLevelSuccess(true);
      setTimeout(() => setCLevelSuccess(false), 3000);
    } catch {
      setCLevelError("Something went wrong");
    } finally {
      setCLevelSaving(false);
    }
  };

  // ── Render ──

  return (
    <section className="rounded-xl border border-white/[0.10] glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-white/[0.10] p-3">
          <User className="h-6 w-6 text-white/70" />
        </div>
        <div className="flex-1 space-y-8">
          {/* ── Header ── */}
          <div>
            <h2 className="text-lg font-semibold text-white">Account</h2>
            <p className="mt-1 text-sm text-white/40">
              Manage your profile details, password, and role settings.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 1: AVATAR
             ═══════════════════════════════════════════════════════════════ */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
              Profile Photo
            </label>
            <div className="flex items-center gap-5">
              {/* Avatar preview */}
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-glass-20 bg-white/[0.10]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-8 w-8 text-white/40" />
                    </div>
                  )}
                </div>

                {/* Upload overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-cyan-500 text-[#050505] transition-colors hover:bg-cyan-400 disabled:opacity-50"
                  title="Upload photo"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload photo
                </button>
                {avatarPreview && (
                  <button
                    onClick={handleAvatarRemove}
                    className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove photo
                  </button>
                )}
                <p className="text-[10px] text-white/30">PNG, JPG or WebP. Max 2MB.</p>
              </div>
            </div>
            {avatarError && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />
                {avatarError}
              </p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 2: PROFILE FIELDS
             ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
                Email Address
              </label>
              <p className="text-sm text-white/70">{userEmail}</p>
              <p className="mt-0.5 text-[10px] text-white/30">
                Email cannot be changed here. Contact support for email updates.
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-name"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
              >
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-cyan-500/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
              >
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-cyan-500/50"
                placeholder="A short description about yourself"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-company"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  <Building2 className="mr-1 inline h-3 w-3" />
                  Company
                </label>
                <input
                  id="profile-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-cyan-500/50"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  <Phone className="mr-1 inline h-3 w-3" />
                  Phone
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-cyan-500/50"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-tz"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
              >
                <Globe className="mr-1 inline h-3 w-3" />
                Timezone
              </label>
              <select
                id="profile-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Profile button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#050505] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {profileSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Profile"
                )}
              </button>
              {profileError && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {profileError}
                </span>
              )}
              {profileSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Profile updated
                </span>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 3: CHANGE PASSWORD
             ═══════════════════════════════════════════════════════════════ */}
          <div className="border-t border-white/[0.10] pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">Change Password</h3>
                <p className="mt-1 text-sm text-white/40">
                  Update your password. You&apos;ll need to enter your current password to make changes.
                </p>

                <div className="mt-4 space-y-4 max-w-md">
                  {/* Current Password */}
                  <div>
                    <label
                      htmlFor="current-pw"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="current-pw"
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 pr-9 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="new-pw"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-pw"
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 pr-9 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password strength */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                          <span>Strength: {pwStrength.label}</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.10]">
                          <div
                            className={`h-full ${pwStrength.color} transition-all duration-300`}
                            style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirm-pw"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full rounded-lg border bg-glass-04 px-3 py-2 text-sm text-white outline-none transition-colors ${
                        confirmPassword && !passwordsMatch
                          ? "border-red-500/50"
                          : confirmPassword && passwordsMatch
                            ? "border-emerald-500/50"
                            : "border-white/[0.10]"
                      } focus:border-cyan-500/50`}
                      placeholder="••••••••"
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="mt-1 text-[10px] text-red-400">Passwords do not match</p>
                    )}
                    {confirmPassword && passwordsMatch && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>

                  {/* Change Password button */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordSaving || !currentPassword || !passwordValid}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-[#050505] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {passwordSaving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                    {passwordError && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {passwordError}
                      </span>
                    )}
                    {passwordSuccess && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Password updated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 4: ROLE & C-LEVEL TITLE
             ═══════════════════════════════════════════════════════════════ */}
          <div className="border-t border-white/[0.10] pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2.5">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">Role & Permissions</h3>
                <p className="mt-1 text-sm text-white/40">
                  Your current role and permissions within the Syntaxure Labs workspace.
                </p>

                <div className="mt-4 space-y-4">
                  {/* Role badge */}
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Current Role
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
                    {isFounder && (
                      <p className="mt-1 text-[10px] text-white/30">
                        Founders have full access to all departments, members, and settings.
                      </p>
                    )}
                  </div>

                  {/* C-Level Title Editor — founder only */}
                  {isFounder && (
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
                        C-Level Title
                      </label>
                      <p className="mb-3 text-xs text-white/50">
                        Refine your founder permissions. This scopes your sidebar and
                        member management to a specific department. Set to{" "}
                        <strong className="text-white/70">none</strong> for
                        unrestricted access.
                      </p>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {/* "None" option */}
                        <button
                          onClick={() => setSelected(null)}
                          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                            selected === null
                              ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                              : "border-white/[0.10] text-white/50 hover:border-border-active hover:text-white/70"
                          }`}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.10] text-xs font-bold text-white/40">
                            —
                          </span>
                          <div>
                            <span className="font-medium">None</span>
                            <p className="text-[11px] text-white/30">
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
                                : "border-white/[0.10] text-white/50 hover:border-border-active hover:text-white/70"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                selected === opt.value
                                  ? "bg-cyan-500/20 text-cyan-400"
                                  : "bg-white/[0.10] text-white/40"
                              }`}
                            >
                              {opt.label.slice(0, 2)}
                            </span>
                            <div>
                              <span className="font-medium">{opt.label}</span>
                              <p className="text-[11px] text-white/30">
                                {opt.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Save button */}
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={handleCLevelSave}
                          disabled={cLevelSaving || selected === cLevelTitle}
                          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#050505] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {cLevelSaving ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            "Save"
                          )}
                        </button>
                        {cLevelError && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {cLevelError}
                          </span>
                        )}
                        {cLevelSuccess && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Updated
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 5: CROSS-APP ACCESS
             ═══════════════════════════════════════════════════════════════ */}
          <div className="border-t border-white/[0.10] pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <ExternalLink className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">Cross-App Access</h3>
                <p className="mt-1 text-sm text-white/40">
                  Your account is shared across all Syntaxure apps. Jump between them
                  without signing in again.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Prism Manage */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_MANAGE_URL || "http://localhost:3007"}/settings`}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.10] bg-glass-04 px-4 py-3 text-sm transition-all hover:border-cyan-500/30 hover:bg-black/30"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-xs font-bold text-cyan-400">
                      M
                    </span>
                    <div>
                      <span className="font-medium text-white/70">Manage</span>
                      <p className="text-[10px] text-white/30">Task management</p>
                    </div>
                  </a>

                  {/* Prism Admin */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004"}/admin`}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.10] bg-glass-04 px-4 py-3 text-sm transition-all hover:border-purple-500/30 hover:bg-black/30"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-bold text-purple-400">
                      A
                    </span>
                    <div>
                      <span className="font-medium text-white/70">Admin</span>
                      <p className="text-[10px] text-white/30">Platform admin</p>
                    </div>
                  </a>

                  {/* Prism Engine */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_PRISM_URL || "http://localhost:3001"}/dashboard`}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.10] bg-glass-04 px-4 py-3 text-sm transition-all hover:border-emerald-500/30 hover:bg-black/30"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      E
                    </span>
                    <div>
                      <span className="font-medium text-white/70">Engine</span>
                      <p className="text-[10px] text-white/30">Prism product</p>
                    </div>
                  </a>

                  {/* Syntaxure Labs */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/profile`}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.10] bg-glass-04 px-4 py-3 text-sm transition-all hover:border-amber-500/30 hover:bg-black/30"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-400">
                      S
                    </span>
                    <div>
                      <span className="font-medium text-white/70">Labs</span>
                      <p className="text-[10px] text-white/30">Company site</p>
                    </div>
                  </a>
                </div>

                {/* Dev Session Bridge */}
                {process.env.NODE_ENV === "development" && (
                  <DevSessionBridge />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Dev Session Bridge ────────────────────────────────────────────────────────

function DevSessionBridge() {
  const [copied, setCopied] = useState(false);
  const [importState, setImportState] = useState<{
    error?: string;
    success?: string;
    loading?: boolean;
    show: boolean;
  }>({ show: false });
  const [pasteValue, setPasteValue] = useState("");

  const handleExport = async () => {
    try {
      const res = await fetch("/api/auth/bridge/export");
      if (!res.ok) throw new Error((await res.json()).error || "Export failed");
      const data = await res.json();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert("Export failed: " + (err instanceof Error ? err.message : err));
    }
  };

  const handleImport = async () => {
    setImportState({ ...importState, loading: true, error: undefined });
    try {
      const parsed = JSON.parse(pasteValue);
      if (!parsed.access_token || !parsed.refresh_token) {
        throw new Error("Invalid session data: missing access_token or refresh_token");
      }
      const res = await fetch("/api/auth/bridge/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportState({ show: true, success: `Session imported as ${data.user?.email || ""}` });
      setPasteValue("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImportState({
        show: true,
        error: err instanceof Error ? err.message : "Import failed",
      });
    } finally {
      setImportState({ ...importState, loading: false });
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-amber-400">
        Dev Auth Bridge
      </p>
      <p className="mt-1 text-[11px] text-white/30">
        Localhost cookies don&apos;t share across ports. Export your session from one
        app and import it into another.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-glass-04 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-amber-500/30 hover:text-amber-400"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Export Session
            </>
          )}
        </button>

        <button
          onClick={() => setImportState({ show: true })}
          className="flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-glass-04 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-amber-500/30 hover:text-amber-400"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Import Session
        </button>
      </div>

      {importState.show && (
        <div className="mt-3 space-y-2">
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder='{"access_token": "...", "refresh_token": "..."}'
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[0.10] bg-glass-04 px-3 py-2 font-mono text-[11px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-amber-500/50"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              disabled={importState.loading || !pasteValue}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-[#050505] transition-colors hover:bg-amber-400 disabled:opacity-40"
            >
              {importState.loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Importing...
                </span>
              ) : (
                "Import"
              )}
            </button>
            <button
              onClick={() => setImportState({ show: false })}
              className="text-[11px] text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
          {importState.error && (
            <p className="flex items-center gap-1 text-[11px] text-red-400">
              <AlertCircle className="h-3 w-3" />
              {importState.error}
            </p>
          )}
          {importState.success && (
            <p className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {importState.success}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
