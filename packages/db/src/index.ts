/**
 * @module @syntaxure-labs/db
 * @description The "Data Nexus" - unified database access for the JeffDev ecosystem.
 *
 * This package provides:
 * - Prisma schema / Postgres access (Supabase) for the Agency + Prism apps
 * - Prism-specific Postgres helpers (`./prism`) — replaces the old Cosmos DB
 *   (MongoDB API + Gremlin) client. See PRISM_MIGRATION.md at the repo root.
 * - Shared Zod schemas for type-safe validation
 *
 * @example
 * // Prism (Postgres/Supabase)
 * import { getPrismDb } from "@syntaxure-labs/db/prism";
 * const db = getPrismDb();
 * const { data: rules } = await db.from("prism_rules").select("*");
 *
 * // Schemas
 * import { UserSchema, RuleSchema } from "@syntaxure-labs/db/schema";
 */

// Prism (Postgres/Supabase) exports
export {
  getPrismDb,
  isValidId,
  getRulesByProject,
  getRelatedRules,
  getConflictingRules,
  getRulesByTags,
  getTagOverlapRuleIds,
  type PrismRuleRow,
} from "./prism";

// Webhook Publisher (n8n integration)
export {
  publishEvent,
  publishReleaseCreated,
  publishWaitlistSignup,
  publishSubscriptionEvent,
  publishContactSubmission,
  publishQuoteRequest,
  publishDeploymentEvent,
  type N8nEvent,
  type N8nEventPayload,
} from "./webhook-publisher";

// Schema exports
export {
  // User
  UserSchema,
  UserRoleSchema,
  type User,
  type UserRole,
  // Rules
  RuleSchema,
  RuleCategorySchema,
  RuleSetSchema,
  type Rule,
  type RuleCategory,
  type RuleSet,
  // Projects (Agency)
  ProjectSchema,
  ProjectStatusSchema,
  type Project,
  type ProjectStatus,
  // Invoices
  InvoiceSchema,
  InvoiceStatusSchema,
  InvoiceItemSchema,
  type Invoice,
  type InvoiceStatus,
  type InvoiceItem,
  // Prism SaaS
  DesignSystemSchema,
  StackSchema,
  PrismProjectSchema,
  ComponentSchema,
  SubscriptionSchema,
  SubscriptionTierSchema,
  SubscriptionStatusSchema,
  UsageSchema,
  VideoTranscriptSchema,
  AvailabilitySlotSchema,
  type DesignSystem,
  type Stack,
  type PrismProject,
  type Component,
  type Subscription,
  type SubscriptionTier,
  type SubscriptionStatus,
  type Usage,
  type VideoTranscript,
  type AvailabilitySlot,
} from "./schema";
