/**
 * Shared Constants
 * ----------------
 * Centralized constants used across sidebar, dashboard, and other components.
 * Eliminates duplication between sidebar.tsx and dashboard/page.tsx.
 */

export const DEPARTMENT_COLORS: Record<string, string> = {
  Executive: "#8b5cf6",
  Engineering: "#06b6d4",
  Operations: "#f59e0b",
  Marketing: "#10b981",
  Product: "#3b82f6",
};

export const DEPARTMENT_DESCRIPTIONS: Record<string, string> = {
  Executive: "Strategy, vision & leadership",
  Engineering: "Building Prism and core infrastructure",
  Operations: "Agency ops, CRM & client delivery",
  Marketing: "GTM, content & brand strategy",
  Product: "Product design, UX & roadmap",
};

export function getDepartmentColor(name: string): string {
  return DEPARTMENT_COLORS[name] || "var(--color-cyan)";
}
