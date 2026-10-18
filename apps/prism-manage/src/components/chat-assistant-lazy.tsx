"use client";

/**
 * Lazy ChatAssistant
 * ------------------
 * The floating assistant sits on every page but is rarely used — code-split
 * it so the widget's bundle never blocks the initial page load.
 */

import dynamic from "next/dynamic";

export const ChatAssistant = dynamic(
  () => import("@syntaxure/ui/chat-assistant").then((m) => m.ChatAssistant),
  { ssr: false },
);
