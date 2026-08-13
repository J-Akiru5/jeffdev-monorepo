"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Client-side wrapper for ChatAssistant to bypass SSR errors.
 * Required because next/dynamic with ssr: false cannot be used directly in Server Components (like layout.tsx).
 */
export const ChatAssistantClient: ComponentType<{
  apiEndpoint: string;
  title?: string;
  welcomeMessage?: string;
  placeholder?: string;
  suggestions?: string[];
}> = dynamic(
  () => import("@syntaxure/ui/chat-assistant").then((mod) => mod.ChatAssistant),
  { ssr: false }
);
