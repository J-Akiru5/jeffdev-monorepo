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
