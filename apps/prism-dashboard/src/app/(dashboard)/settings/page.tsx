"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Key, 
  CreditCard,
  ExternalLink
} from "lucide-react";
import { GlassPanel, Button, Badge } from "@jdstudio/ui";

/**
 * Settings Page
 * User profile, notifications, and subscription management.
 */
export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-1">
          Manage your account preferences and subscription.
        </p>
      </div>

      {/* Profile Section */}
      <GlassPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white">Profile</h2>
            <p className="text-sm text-white/50 mt-1">
              Your profile information is managed through Clerk.
            </p>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-white/60">Email</span>
                <span className="text-sm text-white font-mono">
                  {user?.primaryEmailAddress?.emailAddress || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-white/60">Name</span>
                <span className="text-sm text-white">
                  {user?.fullName || user?.firstName || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white/60">Member Since</span>
                <span className="text-sm text-white font-mono">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"
                  }
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="secondary" size="sm" asChild>
                <a 
                  href="https://accounts.prism.jeffdev.studio/user" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Manage Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Subscription Section */}
      <GlassPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-white">Subscription</h2>
              <Badge variant="default">Free</Badge>
            </div>
            <p className="text-sm text-white/50 mt-1">
              Your current plan and usage limits.
            </p>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <UsageStat label="Projects" value="0" limit="1" />
              <UsageStat label="Rules" value="0" limit="5" />
              <UsageStat label="Components" value="0" limit="3" />
              <UsageStat label="AI Gen/mo" value="0" limit="10" />
            </div>

            <div className="mt-6">
              <Button variant="primary" size="sm" asChild>
                <Link href="/subscription">
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Notifications Section */}
      <GlassPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Bell className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white">Notifications</h2>
            <p className="text-sm text-white/50 mt-1">
              Configure how you receive updates.
            </p>
            
            <div className="mt-4 space-y-3">
              <NotificationToggle 
                label="Product Updates" 
                description="New features and improvements"
                defaultChecked
              />
              <NotificationToggle 
                label="Usage Alerts" 
                description="When approaching plan limits"
                defaultChecked
              />
              <NotificationToggle 
                label="Marketing" 
                description="Tips, tutorials, and offers"
              />
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* API Keys Section */}
      <GlassPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Key className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white">API Access</h2>
            <p className="text-sm text-white/50 mt-1">
              Manage your API keys for MCP integration.
            </p>
            
            <div className="mt-4 p-4 rounded-md border border-white/5 bg-white/[0.02]">
              <p className="text-sm text-white/40 text-center">
                API keys are available on Pro plans and above.
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

function UsageStat({ 
  label, 
  value, 
  limit 
}: { 
  label: string; 
  value: string; 
  limit: string;
}) {
  return (
    <div className="p-3 rounded-md border border-white/5 bg-white/[0.02]">
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">
        {value}
        <span className="text-white/30 text-sm font-normal">/{limit}</span>
      </p>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultChecked = false
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-5 w-10 rounded-full appearance-none bg-white/10 checked:bg-cyan-500 relative cursor-pointer transition-colors
          before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform
          checked:before:translate-x-5"
      />
    </label>
  );
}
