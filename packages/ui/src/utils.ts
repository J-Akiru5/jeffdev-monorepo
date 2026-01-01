import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes safely.
 * Combines clsx for conditional classes with tailwind-merge for conflict resolution.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-cyan-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
