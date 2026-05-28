"use client";

/**
 * RealtimeClock
 * -------------
 * Displays a live updating clock and date in the sidebar footer.
 * Updates every second.
 */

import { useState, useEffect } from "react";

export function RealtimeClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Avoid hydration mismatch
  if (!time) return null;

  return (
    <div className="px-3 py-2 text-center">
      <p className="font-mono text-sm tracking-wider text-text-primary">
        {time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </p>
      <p className="font-mono text-[10px] text-text-quiet">
        {time.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
