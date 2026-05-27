/**
 * Settings Page
 * -------------
 * App settings, workspace member management, and Google Calendar configuration.
 */

import { createClient } from "@/lib/supabase/server";
import { Calendar, RefreshCw, User, Bell } from "lucide-react";
import { ThemeSection } from "@/components/settings/theme-section";
import { WorkspaceMembersSettings } from "@/components/settings/workspace-members";
import { getWorkspaceMembers } from "@/app/actions/workspace";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch members for the Syntaxure Labs workspace if user is logged in
  let members: Awaited<ReturnType<typeof getWorkspaceMembers>>["members"] = [];
  let syntaxureWorkspaceId: string | null = null;

  if (user) {
    const { data: wsMemberships } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(id, name)")
      .eq("user_id", user.id);

    const syntaxureWs = (wsMemberships || []).find(
      (m: Record<string, unknown>) =>
        (m.workspaces as { name: string }).name === "Syntaxure Labs" ||
        (m.workspaces as { name: string }).name === "Syntaxure Labs, Inc."
    ) as { workspaces: { id: string } } | undefined;

    if (syntaxureWs) {
      syntaxureWorkspaceId = syntaxureWs.workspaces.id;
      const result = await getWorkspaceMembers(syntaxureWorkspaceId);
      members = result.members;
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your tracker preferences and workspace
        </p>
      </div>

      <div className="space-y-6">
        {/* Workspace Members (only shown for Syntaxure Labs workspace members) */}
        {syntaxureWorkspaceId && members.length > 0 && (
          <WorkspaceMembersSettings
            members={members}
            workspaceId={syntaxureWorkspaceId}
            currentUserId={user?.id || ""}
          />
        )}

        {/* Appearance */}
        <ThemeSection />

        {/* Google Calendar Integration */}
        <section className="rounded-xl border border-glass-10 glass-subtle p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-cyan-500/10 p-3">
              <Calendar className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">
                Google Calendar
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Connect your Google Calendar to sync events and tasks.
              </p>

              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-400">
                  <strong>Not connected.</strong> Configure Google Cloud Console
                  to enable sync.
                </p>
              </div>

              <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#050505] transition-colors hover:bg-cyan-400 disabled:opacity-50">
                Connect Google Account
              </button>
            </div>
          </div>
        </section>

        {/* Sync Settings */}
        <section className="rounded-xl border border-glass-10 glass-subtle p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <RefreshCw className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">Sync Options</h2>
              <p className="mt-1 text-sm text-text-muted">
                Configure how tasks sync with your calendar.
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Auto-sync tasks with due dates
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Create calendar events for new tasks
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Import calendar events as tasks
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border border-glass-10 glass-subtle p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <Bell className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Configure task reminders and alerts.
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Due date reminders
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Daily task summary
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Profile */}
        <section className="rounded-xl border border-glass-10 glass-subtle p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-glass-10 p-3">
              <User className="h-6 w-6 text-text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">Account</h2>
              <p className="mt-1 text-sm text-text-muted">
                Manage your account settings.
              </p>

              <div className="mt-4">
                <p className="text-sm text-text-tertiary">
                  Logged in via Supabase Auth (same as Syntaxure Labs app)
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
