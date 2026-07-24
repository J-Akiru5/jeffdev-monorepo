"use client";

import Image from "next/image";

export function KwadraWidget() {
  const handleClick = () => {
    const message = "Syntaxure Labs is officially incubated by ISAT-U Kwadra TBI, a government Technology Business Incubator supported by the DOST and operated by ISAT-U.\n\nAs a member of Cohort 5, this institutional backing supports our operations through mentorship in enterprise scaling, startup law, and commercialization.\n\nThis foundation ensures our engineering frameworks are built reliably to meet strict industry standards.\n\nHow can we help you build your project today?";
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { message },
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="group fixed bottom-6 left-6 z-40 flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 p-1.5 pr-4 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-[var(--bg-secondary)] md:bottom-8 md:left-8 text-left"
      aria-label="Backed by Kwadra TBI. Click to learn more."
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-black/5 dark:border-white/10">
        <Image
          src="/kwadra.png"
          alt="Kwadra TBI"
          width={32}
          height={32}
          className="h-full w-full rounded-full object-contain scale-[1.15]"
        />
        {/* Pulsing indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      </div>
      <div className="flex flex-col">
        <span className="font-mono text-[8px] uppercase tracking-wider text-[var(--text-tertiary)]">
          Incubated by
        </span>
        <span className="text-xs font-semibold text-[var(--text-primary)] transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400">
          ISAT-U Kwadra TBI
        </span>
      </div>
    </button>
  );
}
