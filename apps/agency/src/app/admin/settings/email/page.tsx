'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function EmailSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock initial data
  const [apiKey, setApiKey] = useState('re_123456789...');
  const [fromEmail, setFromEmail] = useState('notifications@jeffdev.studio');
  const [templates, setTemplates] = useState({
    welcome: true,
    invoice: true,
    quote: true,
    broadcast: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Email settings updated');
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
          <h1 className="text-3xl font-bold text-white">Email Configuration</h1>
          <p className="mt-2 text-white/50">
            Manage Resend integration and email templates.
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

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Resend Config */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black/40 text-white">
              <span className="font-mono font-bold">R</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Resend Integration</h2>
              <p className="text-sm text-white/40">Connected to JeffDev Production</p>
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-3 w-3" />
              Active
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-purple-500/50 font-mono"
                />
                <button className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5">
                  Rotate
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-white/50">
                From Address
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Active Templates</h2>
          
          <div className="space-y-3">
            {Object.entries(templates).map(([key, enabled]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border border-white/5 bg-black/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-white/40" />
                  <span className="text-sm capitalize text-white">{key} Email</span>
                </div>
                <div
                  onClick={() => setTemplates({ ...templates, [key]: !enabled })}
                  className={`cursor-pointer h-5 w-9 rounded-full px-0.5 transition-colors ${
                    enabled ? 'bg-purple-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
