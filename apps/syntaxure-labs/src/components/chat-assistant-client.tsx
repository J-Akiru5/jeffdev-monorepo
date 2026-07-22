"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper for ChatAssistant to bypass SSR errors.
 * Required because next/dynamic with ssr: false cannot be used directly in Server Components (like layout.tsx).
 */
export const ChatAssistantClient = dynamic(
  () => import("@syntaxure/ui/chat-assistant").then((mod) => mod.ChatAssistant),
  { ssr: false }
);
