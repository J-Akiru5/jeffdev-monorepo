import { z } from "zod";

/**
 * Project/List Schema
 * -------------------
 * Represents a task list (like "My Tasks", "Academics", etc.)
 */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().optional(), // Hex color for list indicator
  icon: z.string().optional(), // Lucide icon name
  order: z.number(),
  createdAt: z.string(), // ISO timestamp
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * Task Schema
 * -----------
 * Individual task item within a project
 */
export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1).max(500),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
  starred: z.boolean().default(false),
  dueDate: z.string().optional(), // ISO date (YYYY-MM-DD)
  dueTime: z.string().optional(), // HH:mm format
  googleEventId: z.string().optional(), // Linked calendar event
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * Calendar Event Schema
 * ---------------------
 * Synced from Google Calendar
 */
export const CalendarEventSchema = z.object({
  id: z.string(),
  googleCalendarId: z.string(),
  title: z.string(),
  start: z.string(), // ISO datetime
  end: z.string(), // ISO datetime
  allDay: z.boolean(),
  linkedTaskId: z.string().optional(),
  syncedAt: z.string(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

/**
 * Create Task Input Schema
 */
export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

/**
 * Create Project Input Schema
 */
export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const MarketingPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeframe: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  order: z.number().default(0),
});

export type MarketingPhase = z.infer<typeof MarketingPhaseSchema>;

export const MarketingKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  current: z.number().default(0),
  target: z.number(),
  unit: z.string().default(""),
});

export type MarketingKpi = z.infer<typeof MarketingKpiSchema>;

export const MarketingTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
  phaseId: z.string(),
  ownerIds: z.string().array().default([]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  platform: z.string().optional(),
  description: z.string().optional(),
  githubIssueNumber: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MarketingTask = z.infer<typeof MarketingTaskSchema>;

export const MarketingTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  initials: z.string(),
  color: z.string(),
  focus: z.string().optional(),
});

export type MarketingTeamMember = z.infer<typeof MarketingTeamSchema>;

export const CreateMarketingKpiSchema = MarketingKpiSchema.omit({ id: true });
export type CreateMarketingKpiInput = z.infer<typeof CreateMarketingKpiSchema>;

export const CreateMarketingTaskSchema = MarketingTaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMarketingTaskInput = z.infer<typeof CreateMarketingTaskSchema>;

// Partial update schemas for type-safe updates
export const UpdateTaskSchema = TaskSchema.partial().pick({
  title: true,
  notes: true,
  completed: true,
  starred: true,
  dueDate: true,
  dueTime: true,
  order: true,
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const UpdateCalendarEventSchema = CalendarEventSchema.partial().pick({
  title: true,
  start: true,
  end: true,
  allDay: true,
  linkedTaskId: true,
});
export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventSchema>;

export const UpdateMarketingKpiSchema = MarketingKpiSchema.partial().pick({
  current: true,
  target: true,
});
export type UpdateMarketingKpiInput = z.infer<typeof UpdateMarketingKpiSchema>;

export const UpdateMarketingTaskSchema = MarketingTaskSchema.partial().pick({
  title: true,
  status: true,
  phaseId: true,
  ownerIds: true,
  priority: true,
  platform: true,
  description: true,
});
export type UpdateMarketingTaskInput = z.infer<typeof UpdateMarketingTaskSchema>;

export const GitHubIssueSchema = z.object({
  number: z.number(),
  title: z.string(),
  state: z.string(),
  body: z.string().nullable().optional(),
  html_url: z.string(),
  created_at: z.string(),
  labels: z.array(z.union([z.string(), z.object({ name: z.string().optional() })])),
});
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>;
