/**
 * @module types
 * @description Shared Zod-derived types for prism-engine collections.
 *
 * These types provide type-safe alternatives to loose `as string` and
 * `Record<string, unknown>` casts throughout the codebase.
 *
 * @example
 * import type { ProjectDoc, BrandDoc } from "@/lib/types";
 * import { ProjectDocSchema } from "@/lib/types";
 *
 * const project = ProjectDocSchema.parse(rawDoc); // validated
 */

import { z } from "zod";

// =============================================================================
// PROJECT DOCUMENT
// =============================================================================

/**
 * Full project document as stored in Cosmos DB.
 * Extends the base PrismProjectSchema with runtime fields.
 */
export const ProjectDocSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  name: z.string(),
  slug: z.string(),
  designSystem: z.string(),
  stack: z.string(),
  visibility: z.enum(["private", "public"]).default("private"),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectDoc = z.infer<typeof ProjectDocSchema>;

// =============================================================================
// RULE DOCUMENT
// =============================================================================

export const RuleDocSchema = z.object({
  _id: z.any().optional(),
  projectId: z.string(),
  createdBy: z.string(),
  name: z.string(),
  category: z.string(),
  content: z.string(),
  description: z.string().optional(),
  priority: z.number().default(50),
  pattern: z.string().nullable().optional(),
  severity: z.enum(["error", "warning", "info"]).default("warning"),
  isActive: z.boolean().default(true),
  source: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RuleDoc = z.infer<typeof RuleDocSchema>;

// =============================================================================
// BRAND DOCUMENT
// =============================================================================

export const BrandColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
});

export const BrandTypographySchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  monoFont: z.string().optional(),
  scale: z.enum(["compact", "default", "spacious"]),
});

export const BrandVoiceSchema = z.object({
  personality: z.string(),
  formality: z.string(),
  keywords: z.array(z.string()).default([]),
});

export const BrandImagerySchema = z.object({
  style: z.string(),
  mood: z.string(),
});

export const BrandSpacingSchema = z.object({
  unit: z.number().default(4),
  borderRadius: z.string(),
});

export const BrandDocSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  slug: z.string(),
  companyName: z.string(),
  tagline: z.string().optional(),
  industry: z.string(),
  colors: BrandColorsSchema,
  typography: BrandTypographySchema,
  voice: BrandVoiceSchema,
  imagery: BrandImagerySchema,
  spacing: BrandSpacingSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type BrandDoc = z.infer<typeof BrandDocSchema>;

// =============================================================================
// SKILL DOCUMENT
// =============================================================================

export const SkillStepSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const SkillDocSchema = z.object({
  _id: z.any().optional(),
  projectId: z.string(),
  createdBy: z.string(),
  name: z.string(),
  description: z.string().default(""),
  category: z.string(),
  steps: z.array(SkillStepSchema),
  tags: z.array(z.string()).default([]),
  source: z.string().default("manual"),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SkillDoc = z.infer<typeof SkillDocSchema>;

// =============================================================================
// COMPONENT DOCUMENT (stored)
// =============================================================================

export const ComponentDocSchema = z.object({
  _id: z.any().optional(),
  projectId: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  code: z.string(),
  designSystem: z.string(),
  stack: z.string(),
  generatedBy: z.string().default("ai"),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type ComponentDoc = z.infer<typeof ComponentDocSchema>;

// =============================================================================
// SUBSCRIPTION DOCUMENT
// =============================================================================

export const SubscriptionDocSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  tier: z.string(),
  status: z.string(),
  paypalSubscriptionId: z.string().nullable().optional(),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type SubscriptionDoc = z.infer<typeof SubscriptionDocSchema>;

// =============================================================================
// API KEY DOCUMENT
// =============================================================================

export const ApiKeyDocSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  keyHash: z.string(),
  keyPrefix: z.string(),
  name: z.string(),
  lastUsedAt: z.string().optional(),
  createdAt: z.string(),
  revokedAt: z.string().optional(),
});

export type ApiKeyDoc = z.infer<typeof ApiKeyDocSchema>;

// =============================================================================
// USAGE DOCUMENT
// =============================================================================

export const UsageDocSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  month: z.string(),
  aiGenerations: z.number().default(0),
  rulesCreated: z.number().default(0),
  componentsCreated: z.number().default(0),
});

export type UsageDoc = z.infer<typeof UsageDocSchema>;

// =============================================================================
// USER PREFERENCES (notifications)
// =============================================================================

export const NotificationPrefsSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  marketing: z.boolean().default(false),
});

export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;
