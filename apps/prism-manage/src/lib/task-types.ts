/**
 * Task Type Configuration
 * -----------------------
 * Centralized config for the 4 task categorization types.
 * Each type has an icon, label, description, and color mapping.
 */

export const TASK_TYPES = {
  feature: {
    icon: "✨",
    label: "Feature",
    description: "A core requirement or new capability to be implemented.",
    color: "#8b5cf6", // Purple
    bgColor: "rgba(139, 92, 246, 0.12)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    textColor: "#a78bfa",
  },
  "nice-to-have": {
    icon: "💡",
    label: "Nice-to-have",
    description: "An enhancement or quality-of-life improvement.",
    color: "#10b981", // Emerald/Green
    bgColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    textColor: "#34d399",
  },
  bug: {
    icon: "🐛",
    label: "Bug",
    description: "Unexpected behavior, UI glitch, or business logic failure.",
    color: "#f59e0b", // Amber/Orange
    bgColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.3)",
    textColor: "#fbbf24",
  },
  error: {
    icon: "🚨",
    label: "Error",
    description: "A critical system failure, crash, or unhandled exception.",
    color: "#ef4444", // Red
    bgColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    textColor: "#f87171",
  },
} as const;

export type TaskTypeKey = keyof typeof TASK_TYPES;

export function getTaskTypeConfig(type: string | null | undefined) {
  if (type && type in TASK_TYPES) {
    return TASK_TYPES[type as TaskTypeKey];
  }
  return TASK_TYPES.feature; // Default fallback
}

/**
 * Priority Configuration
 */
export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "#6b7280",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
  },
  high: {
    label: "High",
    color: "#ef4444",
  },
} as const;

export type PriorityKey = keyof typeof PRIORITY_CONFIG;

/**
 * Status Configuration
 */
export const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "#6b7280",
  },
  in_progress: {
    label: "In Progress",
    color: "#3b82f6",
  },
  review: {
    label: "In Review",
    color: "#8b5cf6",
  },
  done: {
    label: "Done",
    color: "#10b981",
  },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;
