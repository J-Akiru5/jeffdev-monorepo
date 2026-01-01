'use client';

import Link from 'next/link';
import { ArrowLeft, Copy, Eye, EyeOff, RefreshCcw, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DevSettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const apiKey = 'sk_live_51M...xY2z';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API Key copied to clipboard');
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

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-white">Developer Settings</h1>
        <p className="mt-2 text-white/50">
          Manage API keys, webhooks, and integrations.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        
        {/* API Keys */}
        <section className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">API Keys</h2>
              <p className="text-sm text-white/40">
                Use these keys to authenticate requests from external services.
              </p>
            </div>
            <button className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90">
              Generate New Key
            </button>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-medium uppercase text-white/50">
              Secret Key (Production)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 rounded-md border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white/80">
                {showKey ? apiKey : '•'.repeat(24)}
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={copyToClipboard}
                className="rounded-md border border-white/10 p-2.5 text-white/40 hover:bg-white/5 hover:text-white"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-400/70">
              ⚠️ Never expose this key in client-side code.
            </p>
          </div>
        </section>

        {/* Webhooks */}
        <section className="rounded-lg border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Webhooks</h2>
              <p className="text-sm text-white/40">
                Receive real-time events for leads and payments.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/40">
              Coming Soon
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}
