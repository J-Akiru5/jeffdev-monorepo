'use client';

/**
 * Profile Settings Form
 * ---------------------
 * Form for editing user profile, bio, photo, and namecard settings.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Save, ExternalLink, Linkedin, Github, Globe, Twitter, Smartphone } from 'lucide-react';
import { updateUserProfile, checkUsernameAvailable } from '@/app/actions/users';
import type { UserProfile } from '@/types/user';
import { toast } from 'sonner';
import { NamecardPreview } from './namecard-preview';
import { SetupGuide } from './setup-guide';

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
    title: profile.title || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    location: profile.location || '',
    social: {
      linkedin: profile.social?.linkedin || '',
      github: profile.social?.github || '',
      twitter: profile.social?.twitter || '',
      website: profile.social?.website || '',
    },
    namecard: {
      username: profile.namecard?.username || '',
      tagline: profile.namecard?.tagline || '',
      showEmail: profile.namecard?.showEmail ?? true,
      showPhone: profile.namecard?.showPhone ?? false,
      accentColor: profile.namecard?.accentColor || '#06b6d4',
      background: profile.namecard?.background || 'gradient-dark',
      socials: {
        linkedin: profile.namecard?.socials?.linkedin ?? true,
        github: profile.namecard?.socials?.github ?? true,
        twitter: profile.namecard?.socials?.twitter ?? true,
        website: profile.namecard?.socials?.website ?? true,
      },
    },
  });

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof prev] as any),
            [child]: value,
          },
        }));
      } else if (parts.length === 3) {
        const [root, parent, child] = parts;
        setFormData((prev) => ({
          ...prev,
          [root]: {
            ...(prev[root as keyof typeof prev] as any),
            [parent]: {
              // @ts-ignore - dynamic nesting is hard to type perfectly
              ...(prev[root as keyof typeof prev]?.[parent] as any),
              [child]: value,
            }
          },
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleUsernameBlur = async () => {
    if (!formData.namecard.username) return;
    
    // Skip check if unchanged
    if (formData.namecard.username === profile.namecard?.username) return;

    const isAvailable = await checkUsernameAvailable(
      formData.namecard.username,
      profile.uid
    );
    
    if (!isAvailable) {
      setUsernameError('This username is already taken');
    } else {
      setUsernameError('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading image...');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload via Server Action (Proxy to bypass CORS)
      const { uploadFile } = await import('@/app/actions/upload');
      const result = await uploadFile(formData);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update State
      setFormData((prev) => ({ ...prev, photoURL: result.url! }));
      toast.success('Image uploaded successfully', { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image', { id: toastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;

    setIsLoading(true);

    const result = await updateUserProfile(profile.uid, formData);

    if (result.success) {
      toast.success('Profile updated successfully');
      router.refresh();
    } else {
      toast.error('Failed to update profile');
    }

    setIsLoading(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left Column: Form (3 cols) */}
      <div className="lg:col-span-3">
        <SetupGuide profile={profile} />
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Photo */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-white/10 overflow-hidden border border-white/10">
                {formData.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.photoURL}
                    alt={formData.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-white/40">
                    {formData.displayName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <label
                className="absolute -bottom-1 -right-1 rounded-full bg-cyan-500 p-2 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div>
              <h3 className="font-medium text-white">{formData.displayName || 'Your Name'}</h3>
              <p className="text-sm text-white/40">{profile.email}</p>
              <p className="text-xs text-white/30 mt-1 capitalize">{profile.role}</p>
            </div>
          </div>

          {/* Basic Info */}
          <section className="space-y-6 rounded-lg border border-white/8 bg-white/2 p-6">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                id="input-display-name"
                label="Display Name"
                value={formData.displayName}
                onChange={(v) => handleChange('displayName', v)}
                required
              />
              <InputField
                id="input-title"
                label="Title / Role"
                value={formData.title}
                onChange={(v) => handleChange('title', v)}
                placeholder="e.g., Lead Developer"
              />
              <InputField
                id="input-phone"
                label="Phone"
                value={formData.phone}
                onChange={(v) => handleChange('phone', v)}
                placeholder="+63 XXX XXX XXXX"
              />
              <InputField
                id="input-location"
                label="Location"
                value={formData.location}
                onChange={(v) => handleChange('location', v)}
                placeholder="e.g., Iloilo, PH"
              />
            </div>
            <div>
              <label htmlFor="input-bio" className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                Bio
              </label>
              <textarea
                id="input-bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/20 resize-none"
                placeholder="A short bio regarding your expertise..."
              />
            </div>
          </section>

          {/* Social Links */}
          <section className="space-y-6 rounded-lg border border-white/8 bg-white/2 p-6">
            <h3 className="text-lg font-semibold text-white">Social Links</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="LinkedIn"
                value={formData.social.linkedin}
                onChange={(v) => handleChange('social.linkedin', v)}
                placeholder="https://linkedin.com/in/..."
                icon={Linkedin}
              />
              <InputField
                label="GitHub"
                value={formData.social.github}
                onChange={(v) => handleChange('social.github', v)}
                placeholder="https://github.com/..."
                icon={Github}
              />
              <InputField
                label="Twitter / X"
                value={formData.social.twitter}
                onChange={(v) => handleChange('social.twitter', v)}
                placeholder="https://x.com/..."
                icon={Twitter}
              />
              <InputField
                label="Website"
                value={formData.social.website}
                onChange={(v) => handleChange('social.website', v)}
                placeholder="https://..."
                icon={Globe}
              />
            </div>
          </section>

          {/* Namecard Settings */}
          <section className="space-y-6 rounded-lg border border-white/8 bg-white/2 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Digital Namecard</h3>
              {formData.namecard.username && (
                <a
                  href={`/card/${formData.namecard.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 flex items-center gap-1 hover:underline"
                >
                  Preview <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputField
                  id="input-username"
                  label="Username"
                  value={formData.namecard.username}
                  onChange={(v) => handleChange('namecard.username', v.toLowerCase().replace(/\s/g, '-'))}
                  placeholder="yourname"
                  onBlur={handleUsernameBlur}
                />
                {usernameError && (
                  <p className="text-xs text-red-400 mt-1">{usernameError}</p>
                )}
              </div>
              <InputField
                label="Tagline"
                value={formData.namecard.tagline}
                onChange={(v) => handleChange('namecard.tagline', v)}
                placeholder="Short catchy tagline"
              />
            </div>

            {/* Visual Customization */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">Appearance</h4>

              {/* Background Selection */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Background Style</label>
                <div className="grid grid-cols-4 gap-2">
                  <BgOption
                    id="gradient-dark"
                    active={formData.namecard.background === 'gradient-dark'}
                    onClick={() => handleChange('namecard.background', 'gradient-dark')}
                    className="bg-gradient-to-br from-gray-900 to-black"
                  />
                  <BgOption
                    id="gradient-light"
                    active={formData.namecard.background === 'gradient-light'}
                    onClick={() => handleChange('namecard.background', 'gradient-light')}
                    className="bg-gradient-to-br from-gray-100 to-white"
                  />
                  <BgOption
                    id="glass-1"
                    active={formData.namecard.background === 'glass-1'}
                    onClick={() => handleChange('namecard.background', 'glass-1')}
                    className="bg-white/10 backdrop-blur-md"
                  />
                  <BgOption
                    id="glass-2"
                    active={formData.namecard.background === 'glass-2'}
                    onClick={() => handleChange('namecard.background', 'glass-2')}
                    className="bg-black/40 backdrop-blur-xl"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.namecard.accentColor}
                    onChange={(e) => handleChange('namecard.accentColor', e.target.value)}
                    className="h-8 w-16 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white/50">{formData.namecard.accentColor}</span>
                </div>
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">Visibility</h4>

              <div className="grid grid-cols-2 gap-4">
                <Checkbox
                  label="Show Email"
                  checked={formData.namecard.showEmail}
                  onChange={(c) => handleChange('namecard.showEmail', c)}
                />
                <Checkbox
                  label="Show Phone"
                  checked={formData.namecard.showPhone}
                  onChange={(c) => handleChange('namecard.showPhone', c)}
                />
              </div>

              <div className="border-t border-white/5 pt-3 mt-1">
                <h5 className="text-[10px] text-white/40 mb-2">SOCIAL ICONS VISIBILITY</h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Checkbox
                    label="LinkedIn"
                    checked={formData.namecard.socials.linkedin}
                    onChange={(c) => handleChange('namecard.socials.linkedin', c)}
                  />
                  <Checkbox
                    label="GitHub"
                    checked={formData.namecard.socials.github}
                    onChange={(c) => handleChange('namecard.socials.github', c)}
                  />
                  <Checkbox
                    label="Twitter"
                    checked={formData.namecard.socials.twitter}
                    onChange={(c) => handleChange('namecard.socials.twitter', c)}
                  />
                  <Checkbox
                    label="Website"
                    checked={formData.namecard.socials.website}
                    onChange={(c) => handleChange('namecard.socials.website', c)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Action Bar */}
          <div className="sticky bottom-6 z-10 flex items-center justify-end gap-3 rounded-lg border border-white/10 bg-black/80 p-4 backdrop-blur-md">
            <button
              type="button"
              className="text-sm text-white/50 hover:text-white transition-colors"
              onClick={() => router.refresh()}
            >
              Discard Changes
            </button>
            <button
              id="btn-save"
              type="submit"
              disabled={isLoading || !!usernameError}
              className="flex items-center gap-2 rounded-md bg-white px-6 py-2 text-sm font-bold text-black transition-transform hover:scale-105 hover:bg-white/90 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Preview (2 cols) */}
      <div className="lg:col-span-2">
        <div className="sticky top-24">
          <NamecardPreview
            {...formData}
            email={profile.email}
            namecard={formData.namecard}
            photoURL={formData.photoURL || ''}
          />

          <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className='flex gap-2 items-start'>
              <Smartphone className='w-4 h-4 text-yellow-500 mt-0.5' />
              <p className="text-xs text-yellow-200/80">
                This preview simulates how your namecard looks on mobile devices. Background styles may vary slightly across browsers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  icon: Icon,
  onBlur,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
    icon?: any;
  onBlur?: () => void;
    id?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-white/40 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-sm border border-white/10 bg-black/20 px-4 py-2 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-white/30 focus:bg-black/40 ${
            Icon ? 'pl-10' : ''
          }`}
        />
      </div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className={`h-4 w-4 rounded border transition-colors flex items-center justify-center ${checked ? 'bg-cyan-500 border-cyan-500' : 'border-white/20 bg-transparent group-hover:border-white/40'
        }`}>
        {checked && <div className="h-2 w-2 rounded-full bg-black" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
        {label}
      </span>
    </label>
  );
}

function BgOption({ active, onClick, className }: { id?: string, active: boolean, onClick: () => void, className: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 w-full rounded-md border transition-all ${className} ${active ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/10 hover:border-white/30'
        }`}
    />
  );
}
