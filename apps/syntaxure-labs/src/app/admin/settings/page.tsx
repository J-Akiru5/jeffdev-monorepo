import Link from 'next/link';
import { ArrowLeft, Settings2, Palette, Bell, Shield, FileCode } from 'lucide-react';
import { cookies } from 'next/headers';
import { BootstrapButton } from '@/components/admin/bootstrap-button';

/**
 * Admin Settings Page
 * -------------------
 * System settings hub for app configuration.
 */

const settingSections = [
  {
    title: 'App Settings',
    description: 'General site configuration, social links, and branding',
    icon: Settings2,
    href: '/admin/settings/app',
    color: 'cyan',
  },
  {
    title: 'Email Templates',
    description: 'Customize automated email notifications',
    icon: Bell,
    href: '/admin/settings/email',
    color: 'purple',
  },
  {
    title: 'Theme & Branding',
    description: 'Colors, logos, and visual identity',
    icon: Palette,
    href: '/admin/settings/theme',
    color: 'emerald',
  },
  {
    title: 'Access Control',
    description: 'Manage user roles and permissions',
    icon: Shield,
    href: '/admin/users',
    color: 'red',
  },
  {
    title: 'Developer',
    description: 'API keys, webhooks, and integrations',
    icon: FileCode,
    href: '/admin/settings/dev',
    color: 'yellow',
  },
];

const colorMap: Record<string, string> = {
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:bg-purple-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:bg-red-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 group-hover:bg-yellow-500/20',
};

const versionDisplay = {
  version: '0.8.0',
  stageBadge: {
    label: 'Beta',
    className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
  }
};

export default async function AdminSettingsPage() {
  await cookies(); // Ensure dynamic rendering

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-white/50">
          Configure your admin panel and integrations.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-md border border-white/8 bg-white/2 p-6 transition-all hover:border-white/15 hover:bg-white/4"
          >
            <div className={`inline-flex rounded-md border p-3 transition-colors ${colorMap[section.color]}`}>
              <section.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-white">{section.title}</h3>
            <p className="mt-1 text-sm text-white/40">{section.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white mb-4">System Info</h2>
        <div className="rounded-md border border-white/8 bg-white/2 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Version</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-sm text-white">{versionDisplay.version}</p>
                <span className={`rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${versionDisplay.stageBadge.className}`}>
                  {versionDisplay.stageBadge.label}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Environment</p>
              <p className="mt-1 font-mono text-sm text-white">
                {process.env.NODE_ENV}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Framework</p>
              <p className="mt-1 font-mono text-sm text-white">Next.js 15+</p>
            </div>
          </div>

          {/* Bootstrap Section */}
          <div className="mt-6 pt-6 border-t border-white/6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Account Setup</p>
            <BootstrapButton />
          </div>
        </div>
      </div>
    </div>
  );
}
