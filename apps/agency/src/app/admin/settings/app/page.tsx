'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AppSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock initial data
  const [settings, setSettings] = useState({
    siteName: 'JeffDev Agency',
    tagline: 'Premium Web Development Services',
    supportEmail: 'support@jeffdev.studio',
    contactPhone: '+63 912 345 6789',
    social: {
      github: 'https://github.com/jeffdev',
      twitter: 'https://twitter.com/jeffdev',
      linkedin: 'https://linkedin.com/in/jeffdev',
      instagram: 'https://instagram.com/jeffdev',
    },
    seo: {
      defaultTitle: 'JeffDev | Enterprise Solutions',
      defaultDescription: 'Building the future of web.',
      keywords: 'web dev, agency, premium, enterprise',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success('App settings updated successfully');
    setIsLoading(false);
  };

  return (
    <div>
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">App Settings</h1>
          <p className="mt-2 text-white/50">
            General site configuration and metadata.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* General Info */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">General Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Contact Phone
              </label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Social Media</h2>
          
          <div className="space-y-4">
            {Object.entries(settings.social).map(([platform, url]) => (
              <div key={platform}>
                <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                  {platform}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, [platform]: e.target.value },
                    })
                  }
                  className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
                />
              </div>
            ))}
          </div>
        </section>

        {/* SEO Defaults */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">SEO Configuration</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Default Title
              </label>
              <input
                type="text"
                value={settings.seo.defaultTitle}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: { ...settings.seo, defaultTitle: e.target.value },
                  })
                }
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Keywords (Comma separated)
              </label>
              <input
                type="text"
                value={settings.seo.keywords}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: { ...settings.seo, keywords: e.target.value },
                  })
                }
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                Default Meta Description
              </label>
              <textarea
                rows={3}
                value={settings.seo.defaultDescription}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: { ...settings.seo, defaultDescription: e.target.value },
                  })
                }
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
