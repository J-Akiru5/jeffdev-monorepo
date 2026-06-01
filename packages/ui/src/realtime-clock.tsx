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
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12; // the hour '0' should be '12'
      const hhStr = String(h).padStart(2, "0");
      setTime(`${hhStr}:${m} ${ampm}`);
      setDateTime(now.toISOString());
    }

    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <time
      dateTime={dateTime}
      className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums"
    >
      {time}
    </time>
  );
}
