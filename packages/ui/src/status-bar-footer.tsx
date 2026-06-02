"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { RealtimeClock } from "./realtime-clock";

export function StatusBarFooter() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"Online" | "Offline">("Offline");
  const [latency, setLatency] = useState<number>(0);
  const [memPct, setMemPct] = useState<number>(0);
  const [version, setVersion] = useState<string>("v0.0.0");

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const start = performance.now();
        const res = await fetch("/api/health");
        const end = performance.now();
        if (res.ok && isMounted) {
          const data = await res.json();
          setStatus("Online");
          setLatency(Math.round(end - start));
          setVersion(`v${data.version}`);
          if (data.memory?.heapTotal) {
            setMemPct(Math.round((data.memory.heapUsed / data.memory.heapTotal) * 100));
          }
        }
      } catch (err) {
        if (isMounted) setStatus("Offline");
      }
    }

    checkHealth();
    const id = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  // You are right. We only need this on the main landing page to show off the "Engine" vibe.
  // It shouldn't clutter the auth, legal, or dashboard pages.
  if (pathname !== "/") return null;

  return (
    <div className="fixed bottom-0 left-0 w-full h-8 z-[100] bg-[#050505] border-t border-[#1f2937] flex items-center justify-between px-4 font-mono text-xs text-[#d1d5db] uppercase tracking-widest">
      {/* Left Section: System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${
              status === "Online" ? "bg-[#10b981] animate-pulse" : "bg-[#ef4444]"
            }`}
          />
          <span className="text-[#ffffff] font-medium">System // {status}</span>
        </div>
        <div className="hidden sm:block">
          <span>{version}</span>
        </div>
      </div>

      {/* Center Section: Latency / Mem */}
      <div className="hidden md:flex items-center gap-6">
        <span className="flex items-center gap-1 text-[#d1d5db]">
          <span className="text-[#06b6d4]">Latency:</span> {latency}ms
        </span>
        <span className="flex items-center gap-1 text-[#d1d5db]">
          <span className="text-[#8b5cf6]">Mem:</span> {memPct}%
        </span>
      </div>

      {/* Right Section: Time and Links */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block pt-[2px]">
          <RealtimeClock className="font-mono text-xs text-[#d1d5db] tabular-nums" />
        </div>
        <div className="hidden sm:block h-3 w-px bg-[#374151] mx-2" />
        <Link href="/privacy" className="text-[#d1d5db] hover:text-[#22d3ee] transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="text-[#d1d5db] hover:text-[#22d3ee] transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
}
