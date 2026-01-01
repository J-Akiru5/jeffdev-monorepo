/**
 * @module @jeffdev/db/schema
 * @description Shared Zod schemas for type-safe data validation.
 * These schemas are the "single source of truth" for data structures
 * used across Agency and Prism apps.
 * 
 * @example
 * import { UserSchema, RuleSchema } from "@jeffdev/db/schema";
 * const user = UserSchema.parse(rawData);
 */

import { z } from "zod";

// =============================================================================
// USER SCHEMAS (Shared between Agency & Prism)
// =============================================================================

/**
 * User roles following principle of least privilege.
 * founder > admin > partner > employee
 */
export const UserRoleSchema = z.enum([
  "founder",
  "admin", 
  "partner",
  "employee"
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Base user schema for Firebase Auth users.
 * This is the structure stored in Firestore `users/{uid}`.
 */
export const UserSchema = z.object({
  uid: z.string().describe("Firebase Auth UID"),
  email: z.string().email().describe("User email address"),
  displayName: z.string().optional().describe("Display name"),
  photoURL: z.string().url().optional().describe("Profile photo URL"),
  role: UserRoleSchema.default("employee").describe("RBAC role"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
  updatedAt: z.string().datetime().optional().describe("Last update timestamp"),
});

export type User = z.infer<typeof UserSchema>;

// =============================================================================
// PRISM RULE SCHEMAS
// =============================================================================

/**
 * Rule category for organization.
 */
export const RuleCategorySchema = z.enum([
  "architecture",
  "styling",
  "security",
  "performance",
  "testing",
  "documentation",
  "custom"
]);

export type RuleCategory = z.infer<typeof RuleCategorySchema>;

/**
 * A single Prism rule that governs AI behavior.
 */
export const RuleSchema = z.object({
  id: z.string().describe("Unique rule identifier"),
  name: z.string().min(1).max(100).describe("Human-readable rule name"),
  description: z.string().max(500).describe("What this rule enforces"),
  category: RuleCategorySchema.describe("Rule category for organization"),
  content: z.string().describe("The actual rule content/instructions"),
  isActive: z.boolean().default(true).describe("Whether rule is enabled"),
  priority: z.number().int().min(1).max(100).default(50).describe("Execution priority (1 = highest)"),
  createdBy: z.string().describe("User ID who created the rule"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
  updatedAt: z.string().datetime().optional().describe("Last update timestamp"),
});

export type Rule = z.infer<typeof RuleSchema>;

/**
 * Rule set - a collection of rules bundled together.
 */
export const RuleSetSchema = z.object({
  id: z.string().describe("Unique rule set identifier"),
  name: z.string().min(1).max(100).describe("Rule set name"),
  description: z.string().max(500).optional().describe("Rule set description"),
  rules: z.array(z.string()).describe("Array of Rule IDs"),
  isPublic: z.boolean().default(false).describe("Whether this set is public"),
  createdBy: z.string().describe("User ID who created the set"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
});

export type RuleSet = z.infer<typeof RuleSetSchema>;

// =============================================================================
// PROJECT SCHEMAS (Agency)
// =============================================================================

/**
 * Project status enum.
 */
export const ProjectStatusSchema = z.enum([
  "discovery",
  "proposal",
  "in_progress",
  "review",
  "completed",
  "on_hold",
  "cancelled"
]);

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

/**
 * Client project in the Agency system.
 */
export const ProjectSchema = z.object({
  id: z.string().describe("Unique project identifier"),
  slug: z.string().describe("URL-friendly slug"),
  name: z.string().min(1).max(200).describe("Project name"),
  clientName: z.string().describe("Client name"),
  clientEmail: z.string().email().describe("Client email"),
  status: ProjectStatusSchema.describe("Current project status"),
  startDate: z.string().datetime().optional().describe("Project start date"),
  endDate: z.string().datetime().optional().describe("Expected end date"),
  budget: z.number().positive().optional().describe("Project budget in USD"),
  assignedTo: z.array(z.string()).default([]).describe("Assigned team member UIDs"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
  updatedAt: z.string().datetime().optional().describe("Last update timestamp"),
});

export type Project = z.infer<typeof ProjectSchema>;

// =============================================================================
// INVOICE SCHEMAS
// =============================================================================

/**
 * Invoice status enum.
 */
export const InvoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled"
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

/**
 * Invoice line item.
 */
export const InvoiceItemSchema = z.object({
  description: z.string().describe("Item description"),
  quantity: z.number().positive().describe("Quantity"),
  unitPrice: z.number().positive().describe("Price per unit in USD"),
  total: z.number().describe("Line item total"),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

/**
 * Invoice document.
 */
export const InvoiceSchema = z.object({
  id: z.string().describe("Unique invoice identifier"),
  invoiceNumber: z.string().describe("Human-readable invoice number"),
  projectId: z.string().optional().describe("Associated project ID"),
  clientName: z.string().describe("Client name"),
  clientEmail: z.string().email().describe("Client email"),
  items: z.array(InvoiceItemSchema).describe("Line items"),
  subtotal: z.number().describe("Subtotal before tax"),
  tax: z.number().default(0).describe("Tax amount"),
  total: z.number().describe("Total amount due"),
  status: InvoiceStatusSchema.describe("Invoice status"),
  dueDate: z.string().datetime().describe("Payment due date"),
  paidAt: z.string().datetime().optional().describe("Payment timestamp"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// =============================================================================
// PRISM SAAS SCHEMAS
// =============================================================================

/**
 * Design system options for Prism projects.
 */
export const DesignSystemSchema = z.enum([
  "jdstudio",
  "bare-minimum",
  "glassmorphic",
  "8bit-nostalgia"
]);

export type DesignSystem = z.infer<typeof DesignSystemSchema>;

/**
 * Stack options for component generation.
 */
export const StackSchema = z.enum([
  "react",
  "nextjs",
  "react-native"
]);

export type Stack = z.infer<typeof StackSchema>;

/**
 * Prism project - user workspace for rules and components.
 */
export const PrismProjectSchema = z.object({
  id: z.string().describe("Unique project identifier"),
  userId: z.string().describe("Owner's Clerk user ID"),
  name: z.string().min(1).max(100).describe("Project name"),
  slug: z.string().describe("URL-friendly slug"),
  designSystem: DesignSystemSchema.describe("Selected design system"),
  stack: StackSchema.describe("Primary stack"),
  visibility: z.enum(["private", "public"]).default("private"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
  updatedAt: z.string().datetime().optional(),
});

export type PrismProject = z.infer<typeof PrismProjectSchema>;

/**
 * Generated component stored in Prism.
 */
export const ComponentSchema = z.object({
  id: z.string().describe("Unique component identifier"),
  projectId: z.string().describe("Parent project ID"),
  userId: z.string().describe("Creator's Clerk user ID"),
  name: z.string().min(1).max(100).describe("Component name"),
  description: z.string().max(500).optional(),
  code: z.string().describe("Generated component code"),
  props: z.record(z.string(), z.unknown()).optional().describe("Component props schema"),
  designSystem: DesignSystemSchema.describe("Design system used"),
  stack: StackSchema.describe("Stack used"),
  generatedBy: z.enum(["ai", "manual", "figma"]).describe("How it was created"),
  linkedRuleIds: z.array(z.string()).default([]).describe("Associated rule IDs"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
  updatedAt: z.string().datetime().optional(),
});

export type Component = z.infer<typeof ComponentSchema>;

/**
 * Subscription tiers for Prism SaaS.
 */
export const SubscriptionTierSchema = z.enum([
  "free",
  "pro",
  "team",
  "enterprise"
]);

export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

/**
 * Subscription status.
 */
export const SubscriptionStatusSchema = z.enum([
  "active",
  "cancelled",
  "past_due",
  "trialing"
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

/**
 * User subscription record.
 */
export const SubscriptionSchema = z.object({
  id: z.string().describe("Unique subscription identifier"),
  userId: z.string().describe("Clerk user ID"),
  tier: SubscriptionTierSchema.describe("Current subscription tier"),
  status: SubscriptionStatusSchema.describe("Subscription status"),
  paypalSubscriptionId: z.string().nullable().describe("PayPal subscription ID"),
  currentPeriodStart: z.string().datetime().describe("Billing period start"),
  currentPeriodEnd: z.string().datetime().describe("Billing period end"),
  createdAt: z.string().datetime().describe("ISO 8601 timestamp"),
  updatedAt: z.string().datetime().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Usage tracking for rate limiting.
 */
export const UsageSchema = z.object({
  id: z.string().describe("Unique usage record identifier"),
  userId: z.string().describe("Clerk user ID"),
  month: z.string().describe("YYYY-MM format"),
  aiGenerations: z.number().default(0).describe("AI generations this month"),
  rulesCreated: z.number().default(0).describe("Rules created this month"),
  componentsCreated: z.number().default(0).describe("Components created this month"),
});

export type Usage = z.infer<typeof UsageSchema>;
