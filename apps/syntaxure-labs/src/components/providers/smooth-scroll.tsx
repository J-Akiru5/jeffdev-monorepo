"use client";

import { ReactNode } from "react";

/**
 * SmoothScroll Provider
 * ---------------------
 * Uses native browser scrolling — the 2026 industry standard for SaaS sites.
 * No custom scroll libraries, no RAF loops, no frame drops on low-end devices.
 *
 * Top SaaS sites (Vercel, Linear, Sentry, Cal.com) all use native scroll.
 * Custom smooth scroll libraries like Lenis add jank on low-end phones
 * and provide minimal UX benefit for B2B/enterprise users.
 */
interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  return <>{children}</>;
}

export default SmoothScroll;
