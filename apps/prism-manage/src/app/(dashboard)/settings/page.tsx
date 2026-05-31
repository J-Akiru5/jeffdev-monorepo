/**
 * Settings Page
 * -------------
 * App settings, workspace member management, and Google Calendar configuration.
 */

import { createClient } from "@/lib/supabase/server";
import { Calendar, RefreshCw, Bell } from "lucide-react";
import { ThemeSection } from "@/components/settings/theme-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { WorkspaceMembersSettings } from "@/components/settings/workspace-members";
import { getWorkspaceMembers } from "@/app/actions/workspace";
import { disconnectCalendar } from "@/app/actions/calendar";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch full profile from user_profiles
  let userName = "User";
  let userEmail = "";
  let userBio: string | null = null;
  let userCompany: string | null = null;
  let userPhone: string | null = null;
  let userTimezone: string | null = null;
  let userAvatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, email, bio, company_name, phone, timezone, avatar_url")
      .eq("id", user.id)
      .single();

    userName = profile?.full_name || user.user_metadata?.full_name as string || user.email?.split("@")[0] || "User";
    userEmail = profile?.email || user.email || "";
    userBio = profile?.bio || null;
    userCompany = profile?.company_name || null;
    userPhone = profile?.phone || null;
    userTimezone = profile?.timezone || null;
    userAvatarUrl = profile?.avatar_url || null;
  }

  // Check Google Calendar connection status
  let isCalendarConnected = false;
  if (user) {
    const { data: token } = await supabase
      .from("user_tokens")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();
    isCalendarConnected = !!token;
  }

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
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your tracker preferences and workspace
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section (with C-Level title editor for founders) */}
        {user && syntaxureWorkspaceId && (
          <ProfileSection
            userName={userName}
            userEmail={userEmail}
            workspaceId={syntaxureWorkspaceId}
            userBio={userBio}
            userCompany={userCompany}
            userPhone={userPhone}
            userTimezone={userTimezone}
            userAvatarUrl={userAvatarUrl}
          />
        )}

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
              <h2 className="text-lg font-semibold text-white">
                Google Calendar
              </h2>
              <p className="mt-1 text-sm text-white/40">
                Connect your Google Calendar to sync events and tasks.
              </p>

              {isCalendarConnected ? (
                <>
                  <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-400">
                      <strong>Connected.</strong> Your Google Calendar is successfully linked.
                    </p>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      await disconnectCalendar();
                    }}
                  >
                    <button className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
                      Disconnect Google Account
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-400">
                      <strong>Not connected.</strong> Configure Google Cloud Console
                      to enable sync.
                    </p>
                  </div>

                  <a
                    href="/api/calendar/auth"
                    className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#050505] transition-colors hover:bg-cyan-400"
                  >
                    Connect Google Account
                  </a>
                </>
              )}
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
              <h2 className="text-lg font-semibold text-white">Sync Options</h2>
              <p className="mt-1 text-sm text-white/40">
                Configure how tasks sync with your calendar.
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    Auto-sync tasks with due dates
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    Create calendar events for new tasks
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">
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
              <h2 className="text-lg font-semibold text-white">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-white/40">
                Configure task reminders and alerts.
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    Due date reminders
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-glass-20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">
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
      </div>
    </div>
  );
}
