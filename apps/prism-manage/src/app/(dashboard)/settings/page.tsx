/**
 * Settings Page
 * -------------
 * App settings and Google Calendar configuration.
 */

import { Calendar, RefreshCw, User, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your tracker preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Google Calendar Integration */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-cyan-500/10 p-3">
              <Calendar className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Google Calendar</h2>
              <p className="mt-1 text-sm text-white/40">
                Connect your Google Calendar to sync events and tasks.
              </p>

              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-400">
                  <strong>Not connected.</strong> Configure Google Cloud Console to enable sync.
                </p>
              </div>

              <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-void transition-colors hover:bg-cyan-400">
                Connect Google Account
              </button>
            </div>
          </div>
        </section>

        {/* Sync Settings */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
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
                  <span className="text-sm text-white/70">Auto-sync tasks with due dates</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Create calendar events for new tasks</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Import calendar events as tasks</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <Bell className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="mt-1 text-sm text-white/40">
                Configure task reminders and alerts.
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Due date reminders</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Daily task summary</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Profile */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-white/10 p-3">
              <User className="h-6 w-6 text-white/70" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Account</h2>
              <p className="mt-1 text-sm text-white/40">
                Manage your account settings.
              </p>

              <div className="mt-4">
                <p className="text-sm text-white/50">
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
