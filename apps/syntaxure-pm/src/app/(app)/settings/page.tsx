import { createServer } from "@syntaxure/supabase/server";
import { redirect } from "next/navigation";
import { User, Mail, Calendar, Shield, Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const createdAt = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const provider =
    user.app_metadata?.providers?.[user.app_metadata?.providers?.length - 1] ||
    user.app_metadata?.provider ||
    "email";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <section className="glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
            <span className="text-2xl font-bold text-white">
              {(user.email?.[0] || "U").toUpperCase()}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-zinc-400">
              Display name is derived from your email. Profile editing coming
              soon.
            </p>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Account</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-zinc-200">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Sign-in Provider</p>
                <p className="text-sm capitalize text-zinc-200">{provider}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Account Created</p>
                <p className="text-sm text-zinc-200">{createdAt}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">User ID</p>
                <p className="font-mono text-xs text-zinc-400">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Appearance</h2>
        </div>
        <div className="rounded-lg bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Theme</p>
              <p className="text-xs text-zinc-500">
                Currently locked to dark mode
              </p>
            </div>
            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
              Dark
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
