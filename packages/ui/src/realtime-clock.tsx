"use client";

import { useState, useEffect } from "react";

/**
 * RealtimeClock
 * -------------
 * Displays the current time in HH:MM 24-hour format, updating every second.
 * Uses a compact monospace style to sit discreetly in the top navbar.
 */

export function RealtimeClock() {
  const [time, setTime] = useState("");
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}`);
      setDateTime(`${hh}:${mm}:${ss}`);
    }

    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <time
      dateTime={dateTime}
      className="hidden font-mono text-xs text-white/40 tabular-nums sm:inline"
    >
      {time}
    </time>
  );
}
