'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Palette, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ThemeSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  const [theme, setTheme] = useState({
    accent: 'cyan',
    glass: 'blur', // blur, clean, noise
    radius: 'sm', // none, sm, md, lg, full
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Theme updated successfully');
    setIsLoading(false);
  };

  const colors = [
    { id: 'cyan', hex: '#06b6d4', name: 'Cyan (Default)' },
    { id: 'purple', hex: '#8b5cf6', name: 'Violet' },
    { id: 'emerald', hex: '#10b981', name: 'Emerald' },
    { id: 'rose', hex: '#f43f5e', name: 'Rose' },
    { id: 'amber', hex: '#f59e0b', name: 'Amber' },
  ];

  const glassPresets = [
    { id: 'clean', name: 'Clean Glass', desc: 'High transparency, subtle border' },
    { id: 'blur', name: 'Deep Blur', desc: 'Heavy backdrop blur, darker tint' },
    { id: 'noise', name: 'Frosted Noise', desc: 'Texture overlay with grain' },
  ];

  return (
    <div>
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Theme & Branding</h1>
          <p className="mt-2 text-white/50">
            Customize the admin panel appearance.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Accent Color */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-white/60" />
            <h2 className="text-lg font-semibold text-white">Accent Color</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => setTheme({ ...theme, accent: color.id })}
                className={`group relative flex items-center gap-3 rounded-md border p-3 transition-all ${
                  theme.accent === color.id
                    ? 'border-white/20 bg-white/10'
                    : 'border-white/5 bg-transparent hover:border-white/10'
                }`}
              >
                <div
                  className="h-4 w-4 rounded-full shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm text-white/80">{color.name}</span>
                {theme.accent === color.id && (
                  <Check className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Radius */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Border Radius</h2>
          <div className="grid grid-cols-5 gap-3">
            {(['none', 'sm', 'md', 'lg', 'full'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTheme({ ...theme, radius: r })}
                className={`flex h-12 flex-col items-center justify-center rounded-md border transition-all ${
                  theme.radius === r
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-white/5 text-white/40 hover:border-white/10 hover:text-white'
                }`}
              >
                <div className={`h-4 w-4 border border-current rounded-${r === 'none' ? 'none' : r}`} />
                <span className="mt-1 text-[10px] uppercase">{r}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Glass Style */}
        <section className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Glassmorphism Style</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {glassPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setTheme({ ...theme, glass: preset.id })}
                className={`relative overflow-hidden rounded-lg border p-6 text-left transition-all ${
                  theme.glass === preset.id
                    ? 'border-cyan-500/50 from-cyan-500/10 to-transparent bg-gradient-to-br'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Preview Layer */}
                <div className="absolute inset-0 z-0 bg-white/5" />
                
                <div className="relative z-10">
                  <h3 className={`font-medium ${
                    theme.glass === preset.id ? 'text-cyan-400' : 'text-white'
                  }`}>
                    {preset.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/50">{preset.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
