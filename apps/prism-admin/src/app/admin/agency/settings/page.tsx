import Link from "next/link";
import { ArrowLeft, Settings, Palette, Mail, Shield, Code } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Settings Page
 * --------------------
 * Settings hub for agency configuration.
 */

export default async function AgencySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">Agency configuration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsCard
          href="/admin/settings"
          icon={Settings}
          title="General Settings"
          description="App name, branding, business info"
        />
        <SettingsCard
          href="/admin/agency/settings"
          icon={Palette}
          title="Theme & Branding"
          description="Colors, fonts, logo"
        />
        <SettingsCard
          href="/admin/agency/settings"
          icon={Mail}
          title="Email Templates"
          description="Invoice, quote, and notification templates"
        />
        <SettingsCard
          href="/admin/agency/settings"
          icon={Shield}
          title="Access Control"
          description="Roles, permissions, and team management"
        />
      </div>
    </div>
  );
}

function SettingsCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">{title}</h3>
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
}
