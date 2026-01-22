import { createClient } from "@/lib/supabase/server";
import { Settings, User, Heart, Bell, Smartphone } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.display_name || "";

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-white/50" />
            <h2 className="font-semibold">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">Display Name</label>
              <input
                type="text"
                defaultValue={displayName}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2.5 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ""}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-md py-2.5 px-4 text-white/50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Health Connect */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-white/50" />
            <h2 className="font-semibold">Health Integrations</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium">Google Fit</p>
                <p className="text-sm text-white/50">Sync heart rate data</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors">
              Connect
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-white/50" />
            <h2 className="font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/80">Workout reminders</span>
              <input
                type="checkbox"
                defaultChecked
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/80">Rest timer alerts</span>
              <input
                type="checkbox"
                defaultChecked
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </div>

        {/* PWA Install */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-5 h-5 text-white/50" />
            <h2 className="font-semibold">Install App</h2>
          </div>

          <p className="text-sm text-white/60 mb-4">
            Install Prism Exercise as an app for quick access and offline support.
          </p>

          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-md transition-colors">
            Add to Home Screen
          </button>
        </div>
      </div>
    </div>
  );
}
