import { z } from "zod";

// ──────────────────────────────────────────────
// Task Type Enum
// ──────────────────────────────────────────────
export const TaskTypeEnum = z.enum(["feature", "nice-to-have", "bug", "error", "uncategorized"]);
export type TaskType = z.infer<typeof TaskTypeEnum>;

export const TaskStatusEnum = z.enum(["backlog", "todo", "in_progress", "in_review", "approved"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(["low", "medium", "high"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

// ──────────────────────────────────────────────
// Workspace Schema
// ──────────────────────────────────────────────
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  createdAt: z.string(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

// ──────────────────────────────────────────────
// Workspace Member Schema (RBAC)
// ──────────────────────────────────────────────
export const WorkspaceRoleEnum = z.enum(["founder", "employee"]);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>;

// ──────────────────────────────────────────────
// C-Level Title Enum
// ──────────────────────────────────────────────
export const CLevelTitleEnum = z.enum(["ceo", "cto", "cpo", "coo", "cmo"]);
export type CLevelTitle = z.infer<typeof CLevelTitleEnum>;

export const WorkspaceMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: WorkspaceRoleEnum,
  cLevelTitle: CLevelTitleEnum.nullable().optional(),
  createdAt: z.string(),
});
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

// ──────────────────────────────────────────────
// Department Schema
// ──────────────────────────────────────────────
export const DepartmentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  createdAt: z.string(),
});
export type Department = z.infer<typeof DepartmentSchema>;

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
 * Individual task item within a project.
 * Maps directly to the Supabase tasks table columns.
 */
export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  workspaceId: z.string().optional(),
  departmentId: z.string().optional(),
  title: z.string().min(1).max(500),

  // Classification
  taskType: TaskTypeEnum.default("uncategorized"),
  status: TaskStatusEnum.default("backlog"),
  priority: TaskPriorityEnum.default("medium"),

  // Content
  description: z.string().optional(), // Long-form (repro steps, acceptance criteria)
  notes: z.string().optional(), // Short internal notes

  // Metadata
  isStarred: z.boolean().default(false),
  assignedTo: z.string().optional(), // User ID
  tags: z.array(z.string()).optional(),

  // Dates
  dueDate: z.string().optional(), // ISO date (YYYY-MM-DD)
  dueTime: z.string().optional(), // HH:mm format
  googleEventId: z.string().optional(), // Linked calendar event

  // Ordering
  order: z.number().default(0),
  pathIndex: z.number().default(0),

  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

// ──────────────────────────────────────────────
// Create Task Input Schema
// ──────────────────────────────────────────────
export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// ──────────────────────────────────────────────
// Update Task Input Schema (partial)
// ──────────────────────────────────────────────
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  taskType: TaskTypeEnum.optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  isStarred: z.boolean().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  order: z.number().optional(),
  pathIndex: z.number().optional(),
  workspaceId: z.string().optional(),
  departmentId: z.string().optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// ──────────────────────────────────────────────
// Workspace + Department Helpers
// ──────────────────────────────────────────────
export const PERSONAL_LISTS = [
  { name: "My Tasks", color: "var(--color-cyan)", icon: "CheckSquare" },
  { name: "Academics", color: "var(--color-purple)", icon: "BookOpen" },
  { name: "Student Council", color: "var(--color-emerald)", icon: "Users" },
  { name: "USC", color: "var(--color-amber)", icon: "GraduationCap" },
  { name: "SineAI Guild", color: "#ef4444", icon: "Bot" },
] as const;

export const SYNTAXURE_DEPARTMENTS = [
  "Executive",
  "Engineering",
  "Operations",
  "Marketing",
  "Product",
] as const;

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
