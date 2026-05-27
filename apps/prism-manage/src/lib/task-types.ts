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
  uncategorized: {
    icon: "📋",
    label: "Uncategorized",
    description: "Default type when no specific category is set.",
    color: "#6b7280", // Gray
    bgColor: "rgba(107, 114, 128, 0.12)",
    borderColor: "rgba(107, 114, 128, 0.3)",
    textColor: "#9ca3af",
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
 * Status Configuration (new workflow)
 */
export const STATUS_CONFIG = {
  backlog: {
    label: "Backlog",
    color: "#6b7280",
  },
  todo: {
    label: "To Do",
    color: "#3b82f6",
  },
  in_progress: {
    label: "In Progress",
    color: "#f59e0b",
  },
  in_review: {
    label: "In Review",
    color: "#8b5cf6",
  },
  approved: {
    label: "Approved",
    color: "#10b981",
  },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

/**
 * RBAC-aware status transitions:
 * - founder/CPO: can move to any status including 'approved'
 * - employee: can only move up to 'in_review'
 */
export const STATUS_TRANSITIONS: Record<StatusKey, StatusKey[]> = {
  backlog: ["todo"],
  todo: ["in_progress"],
  in_progress: ["in_review"],
  in_review: ["backlog", "approved"],
  approved: ["in_review", "backlog"],
};

export const STAFF_LOCKED_STATUSES: StatusKey[] = ["approved"];
