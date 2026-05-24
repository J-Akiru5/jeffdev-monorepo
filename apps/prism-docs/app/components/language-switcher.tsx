"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { locale: "en-US", text: "English (US)" },
  { locale: "tl", text: "Tagalog" },
  { locale: "ja", text: "日本語" },
  { locale: "es", text: "Español" },
  { locale: "id", text: "Indonesia" },
  { locale: "en-GB", text: "English (UK)" },
  { locale: "ru", text: "Русский" },
  { locale: "nl", text: "Nederlands" },
];

const LOCALE_COOKIE = "PRISM_LOCALE";

function setLocaleCookie(locale: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current language from URL
  // path format: /en-US/foo or /en-US
  const currentLang =
    LANGUAGES.find((l) => pathname?.startsWith(`/${l.locale}`)) ??
    LANGUAGES[0]!;

  const handleSwitch = (locale: string) => {
    if (!pathname) return;

    // Save locale preference in cookie (expires in 1 year)
    setLocaleCookie(locale);

    // Replace the first segment (locale) with the new locale
    const segments = pathname.split("/");
    // segments[0] is empty, segments[1] is locale
    segments[1] = locale;
    const newPath = segments.join("/");

    router.push(newPath);
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white/70 hover:text-cyan-400 hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
      >
        <Globe size={16} />
        <span>{currentLang.text}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.locale}
                onClick={() => handleSwitch(lang.locale)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-cyan-500/10 hover:text-cyan-400 ${
                  currentLang.locale === lang.locale
                    ? "text-cyan-400 bg-cyan-500/5"
                    : "text-white/70"
                }`}
              >
                {lang.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
