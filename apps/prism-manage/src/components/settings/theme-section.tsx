"use client";

/**
 * Theme Section
 * -------------
 * Client component for theme preference in settings.
 * Includes a control to set the current theme as the default for all Syntaxure apps.
 */

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Globe, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateDefaultTheme } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/browser";

export function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [defaultTheme, setDefaultTheme] = useState<string | null>(null);

  // Load the existing default theme from user_profiles.preferences
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_profiles")
        .select("preferences")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.preferences) {
            const prefs = data.preferences as Record<string, unknown>;
            if (typeof prefs.default_theme === "string") {
              setDefaultTheme(prefs.default_theme);
            }
          }
        });
    });
  }, []);

  const themes = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  const handleSetDefault = async () => {
    if (!theme) return;
    setSaving(true);
    const result = await updateDefaultTheme(theme);
    setSaving(false);
    if (result.success) {
      setDefaultTheme(theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error(result.error || "Failed to save default theme");
    }
  };

  return (
    <section className="rounded-xl border border-border glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-purple-500/10 p-3">
          <Monitor className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="mt-1 text-sm text-white/40">
              Choose between dark, light, or system theme
            </p>

            <div className="mt-4 flex gap-3">
              {themes.map((t) => {
                const Icon = t.icon;
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                        : "border-border text-white/50 hover:border-border-active hover:text-white/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Default Theme for All Apps ── */}
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-4 w-4 text-cyan-400" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">
                  Cross-App Theme Default
                </h3>
                <p className="mt-0.5 text-xs text-white/40">
                  Set the current theme as the default for all Syntaxure apps
                  (Admin, Engine, Labs). Each app will use this theme on first
                  visit or when you sign in on a new device.
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleSetDefault}
                    disabled={saving || !theme}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-[#050505] transition-colors hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : saved ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    {saving
                      ? "Saving..."
                      : saved
                        ? "Saved!"
                        : `Set ${theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"} as default`}
                  </button>

                  {defaultTheme && (
                    <span className="text-[11px] text-white/40">
                      Current default:{" "}
                      <span className="font-mono text-white/70">
                        {defaultTheme}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
