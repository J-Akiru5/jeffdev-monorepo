"use client";

/**
 * Theme Section
 * -------------
 * Client component for theme preference in settings.
 * Needs "use client" to use the useTheme() hook from next-themes.
 */

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <section className="rounded-xl border border-white/10 glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-purple-500/10 p-3">
          <Monitor className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1">
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
                      : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
