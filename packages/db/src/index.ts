/**
 * @module @jeffdev/db
 * @description The "Data Nexus" - unified database access for the JeffDev ecosystem.
 * 
 * This package provides:
 * - MongoDB / Cosmos DB client for Prism
 * - Gremlin graph client for Cosmos DB
 * - Shared Zod schemas for type-safe validation
 * 
 * @example
 * // Cosmos DB (Prism)
 * import { getCollection } from "@jeffdev/db/cosmos";
 * const rules = await getCollection("rules");
 * 
 * // Schemas
 * import { UserSchema, RuleSchema } from "@jeffdev/db/schema";
 */


// Cosmos/MongoDB exports
export {
  getMongoClient,
  getDatabase,
  getCollection,
  closeConnection,
  ObjectId,
  type Db,
  type Collection,
  type Document,
  type MongoClient,
} from "./cosmos.js";

// Cosmos/Gremlin exports
export {
  getGremlinClient,
  closeGremlinClient,
  getRulesByProject,
  getRelatedRules,
  getConflictingRules,
  getRulesByTags,
} from "./cosmos-gremlin.js";

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
  type DesignSystem,
  type Stack,
  type PrismProject,
  type Component,
  type Subscription,
  type SubscriptionTier,
  type SubscriptionStatus,
  type Usage,
  type VideoTranscript,
} from "./schema.js";
