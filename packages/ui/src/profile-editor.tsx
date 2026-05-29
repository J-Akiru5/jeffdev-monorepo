"use client";

/**
 * ProfileEditor
 * -------------
 * Shared profile editing component for all Syntaxure apps.
 * Handles avatar upload, profile fields (name, bio, company, phone, timezone),
 * and optional password change.
 *
 * Apps provide their own backend callbacks so this component stays storage-agnostic.
 *
 * Usage:
 *   <ProfileEditor
 *     initialData={{ fullName, email, bio, ... }}
 *     onSave={async (data) => { ... return { success: true }; }}
 *     onChangePassword={async (cur, next) => { ... return { success: true }; }}
 *     onUploadAvatar={async (file) => { ... return { url: "...", error?: "..." }; }}
 *     onRemoveAvatar={async () => { ... return { success: true }; }}
 *     extra={<CLevelEditor />}
 *   />
 */

import { useState, useRef } from "react";
import {
  User,
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
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProfileEditorData {
  fullName: string;
  email: string;
  bio?: string | null;
  companyName?: string | null;
  phone?: string | null;
  timezone?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileEditorProps {
  /** Initial profile data */
  initialData: ProfileEditorData;

  /** Save profile fields. Return { success: true } or { success: false, error: "..." } */
  onSave: (data: {
    fullName: string;
    bio: string;
    companyName: string;
    phone: string;
    timezone: string;
  }) => Promise<{ success: boolean; error?: string }>;

  /** Change password (optional — omit to hide password section) */
  onChangePassword?: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;

  /** Upload avatar (optional — omit to hide avatar upload). Return the public URL. */
  onUploadAvatar?: (file: File) => Promise<{ url: string; error?: string }>;

  /** Remove avatar (optional) */
  onRemoveAvatar?: () => Promise<{ success: boolean; error?: string }>;

  /** Extra content to render below the profile editor (e.g., C-Level editor, cross-app links) */
  extra?: React.ReactNode;

  /** Section header customization */
  title?: string;
  description?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(pass: string): PasswordStrength {
  if (!pass) return { score: 0, label: "", color: "bg-white/10" };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-white/10",
    "bg-red-500",
    "bg-yellow-500",
    "bg-cyan-500",
    "bg-emerald-500",
  ];
  return {
    score,
    label: labels[score] || "",
    color: colors[score] || "bg-white/10",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileEditor({
  initialData,
  onSave,
  onChangePassword,
  onUploadAvatar,
  onRemoveAvatar,
  extra,
  title = "Account",
  description = "Manage your profile details, password, and role settings.",
}: ProfileEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile fields ──
  const [fullName, setFullName] = useState(initialData.fullName);
  const [bio, setBio] = useState(initialData.bio || "");
  const [company, setCompany] = useState(initialData.companyName || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [timezone, setTimezone] = useState(initialData.timezone || "UTC");

  // ── Password fields ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // ── UI state ──
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData.avatarUrl || null,
  );

  const pwStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  const passwordValid =
    newPassword.length >= 8 &&
    passwordsMatch &&
    newPassword !== currentPassword;

  // ── Handlers ──

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    const result = await onSave({
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
    if (!onChangePassword) return;
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

    const result = await onChangePassword(currentPassword, newPassword);

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
    if (!file || !onUploadAvatar) return;

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
      const result = await onUploadAvatar(file);
      if (result.error) {
        setAvatarError(result.error);
      } else {
        setAvatarPreview(result.url);
      }
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Failed to upload avatar",
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!onRemoveAvatar) return;
    setAvatarPreview(null);
    setAvatarError(null);
    const result = await onRemoveAvatar();
    if (result.error) setAvatarError(result.error);
  };

  // ── Render ──

  return (
    <section className="rounded-xl border border-glass-10 glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-glass-10 p-3">
          <User className="h-6 w-6 text-text-secondary" />
        </div>
        <div className="flex-1 space-y-8">
          {/* ── Header ── */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 1: AVATAR
             ═══════════════════════════════════════════════════════════════ */}
          {onUploadAvatar && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                Profile Photo
              </label>
              <div className="flex items-center gap-5">
                {/* Avatar preview */}
                <div className="relative">
                  <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-glass-20 bg-glass-10">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-8 w-8 text-text-muted" />
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
                  {avatarPreview && onRemoveAvatar && (
                    <button
                      onClick={handleAvatarRemove}
                      className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove photo
                    </button>
                  )}
                  <p className="text-[10px] text-text-quiet">
                    PNG, JPG or WebP. Max 2MB.
                  </p>
                </div>
              </div>
              {avatarError && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {avatarError}
                </p>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 2: PROFILE FIELDS
             ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                Email Address
              </label>
              <p className="text-sm text-text-secondary">
                {initialData.email}
              </p>
              <p className="mt-0.5 text-[10px] text-text-quiet">
                Email cannot be changed here. Contact support for email updates.
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-editor-name"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                Full Name
              </label>
              <input
                id="profile-editor-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-quiet focus:border-cyan-500/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="profile-editor-bio"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                Bio
              </label>
              <textarea
                id="profile-editor-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-quiet focus:border-cyan-500/50"
                placeholder="A short description about yourself"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-editor-company"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
                >
                  <Building2 className="mr-1 inline h-3 w-3" />
                  Company
                </label>
                <input
                  id="profile-editor-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-quiet focus:border-cyan-500/50"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-editor-phone"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
                >
                  <Phone className="mr-1 inline h-3 w-3" />
                  Phone
                </label>
                <input
                  id="profile-editor-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-quiet focus:border-cyan-500/50"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-editor-tz"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                <Globe className="mr-1 inline h-3 w-3" />
                Timezone
              </label>
              <select
                id="profile-editor-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full appearance-none rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-cyan-500/50"
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
             SECTION 3: CHANGE PASSWORD (optional)
             ═══════════════════════════════════════════════════════════════ */}
          {onChangePassword && (
            <div className="border-t border-glass-10 pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  <Lock className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-text-primary">
                    Change Password
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    Update your password. You&apos;ll need to enter your current
                    password to make changes.
                  </p>

                  <div className="mt-4 space-y-4 max-w-md">
                    {/* Current Password */}
                    <div>
                      <label
                        htmlFor="profile-editor-current-pw"
                        className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
                      >
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="profile-editor-current-pw"
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 pr-9 text-sm text-text-primary outline-none transition-colors focus:border-cyan-500/50"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                        >
                          {showCurrentPw ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label
                        htmlFor="profile-editor-new-pw"
                        className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="profile-editor-new-pw"
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-glass-10 bg-glass-04 px-3 py-2 pr-9 text-sm text-text-primary outline-none transition-colors focus:border-cyan-500/50"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                        >
                          {showNewPw ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Password strength */}
                      {newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                            <span>Strength: {pwStrength.label}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-glass-10">
                            <div
                              className={`h-full ${pwStrength.color} transition-all duration-300`}
                              style={{
                                width: `${(pwStrength.score / 4) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label
                        htmlFor="profile-editor-confirm-pw"
                        className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="profile-editor-confirm-pw"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full rounded-lg border bg-glass-04 px-3 py-2 text-sm text-text-primary outline-none transition-colors ${
                          confirmPassword && !passwordsMatch
                            ? "border-red-500/50"
                            : confirmPassword && passwordsMatch
                              ? "border-emerald-500/50"
                              : "border-glass-10"
                        } focus:border-cyan-500/50`}
                        placeholder="••••••••"
                      />
                      {confirmPassword && !passwordsMatch && (
                        <p className="mt-1 text-[10px] text-red-400">
                          Passwords do not match
                        </p>
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
                        disabled={
                          passwordSaving ||
                          !currentPassword ||
                          !passwordValid
                        }
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
          )}

          {/* ═══════════════════════════════════════════════════════════════
             SECTION 4: EXTRA (app-specific content)
             ═══════════════════════════════════════════════════════════════ */}
          {extra && <div className="space-y-4">{extra}</div>}
        </div>
      </div>
    </section>
  );
}
