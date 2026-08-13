/**
 * @module @syntaxure-labs/db/prism
 * @description Postgres (Supabase) access for the Prism Context Engine.
 *
 * Replaces `./cosmos` (Azure Cosmos DB, MongoDB API) and `./cosmos-gremlin`
 * (Cosmos DB Gremlin graph). See PRISM_MIGRATION.md at the repo root for the
 * full migration writeup.
 *
 * Design notes:
 * - Prism's tables (`prism_*`) have RLS enabled with a service-role-only
 *   policy — same trust model the Cosmos client had (a privileged handle,
 *   with every route doing its own `userId` filtering in application code).
 *   `getPrismDb()` returns that privileged handle. It is NOT the
 *   session-scoped client used for `supabase.auth.getUser()` — callers still
 *   need their own auth check before querying, exactly as before.
 * - IDs are Postgres UUIDs now, not Mongo ObjectIds. `isValidId()` is a
 *   drop-in replacement for `ObjectId.isValid()`; there is no replacement
 *   needed for `new ObjectId(id)` — just use the plain string id.
 * - The Gremlin rules graph (tag/relates_to/conflicts_with edges) is
 *   replaced by `prism_rule_edges` (explicit edges) plus a GIN index on
 *   `prism_rules.tags` (tag overlap no longer needs a graph traversal).
 *
 * @example
 * import { getPrismDb } from "@syntaxure-labs/db/prism";
 * const db = getPrismDb();
 * const { data } = await db.from("prism_rules").select("*").eq("created_by", userId);
 */

import { createAdmin } from "@syntaxure/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get the privileged (service-role) Supabase client for Prism tables.
 * Bypasses RLS — callers are responsible for their own authorization,
 * same as every Cosmos DB call site was before this migration.
 *
 * Explicitly typed `SupabaseClient<any, any, any>` (all three generic
 * slots, not just the first) — there's no generated `Database` schema type
 * for `prism_*` here, and passing only a partial `any` makes
 * `@supabase/supabase-js`'s `.select("aliased:column, ...")` string-parsing
 * generics degrade query results to `never` instead of falling back to a
 * loose row type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see doc comment above
export function getPrismDb(): SupabaseClient<any, any, any> {
  return createAdmin();
}

/**
 * Validate a Postgres UUID string. Drop-in replacement for MongoDB's
 * `ObjectId.isValid()` at call sites that guarded lookups with it.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidId(id: string): boolean {
  return typeof id === "string" && UUID_RE.test(id);
}

// =============================================================================
// Rule graph helpers (replace @syntaxure-labs/db/cosmos-gremlin)
// =============================================================================

export interface PrismRuleRow {
  id: string;
  name: string;
  content: string;
  category: string;
  priority: number;
  tags: string[];
  [key: string]: unknown;
}

/**
 * Get rules for a project, ordered by priority ascending (1 = highest,
 * matching the priority convention used across Prism — lower number wins).
 */
export async function getRulesByProject(
  projectId: string,
  limit = 10,
): Promise<PrismRuleRow[]> {
  const db = getPrismDb();
  const { data, error } = await db
    .from("prism_rules")
    .select("*")
    .eq("project_id", projectId)
    .order("priority", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as PrismRuleRow[]) || [];
}

/**
 * Get rules related to a given rule via `relates_to` edges.
 */
export async function getRelatedRules(ruleId: string): Promise<PrismRuleRow[]> {
  const db = getPrismDb();
  const { data: edges, error: edgeError } = await db
    .from("prism_rule_edges")
    .select("to_rule_id")
    .eq("from_rule_id", ruleId)
    .eq("edge_type", "relates_to");
  if (edgeError) throw edgeError;
  const ids = (edges || []).map((e: { to_rule_id: string }) => e.to_rule_id);
  if (ids.length === 0) return [];

  const { data, error } = await db.from("prism_rules").select("*").in("id", ids);
  if (error) throw error;
  return (data as PrismRuleRow[]) || [];
}

/**
 * Get rules that conflict with a given rule via `conflicts_with` edges.
 */
export async function getConflictingRules(
  ruleId: string,
): Promise<PrismRuleRow[]> {
  const db = getPrismDb();
  const { data: edges, error: edgeError } = await db
    .from("prism_rule_edges")
    .select("to_rule_id")
    .eq("from_rule_id", ruleId)
    .eq("edge_type", "conflicts_with");
  if (edgeError) throw edgeError;
  const ids = (edges || []).map((e: { to_rule_id: string }) => e.to_rule_id);
  if (ids.length === 0) return [];

  const { data, error } = await db.from("prism_rules").select("*").in("id", ids);
  if (error) throw error;
  return (data as PrismRuleRow[]) || [];
}

/**
 * Get rules that have any of the given tags. Replaces the Gremlin "tag"
 * vertex traversal — tags live directly on `prism_rules.tags` (GIN-indexed),
 * so this is a plain array-overlap query instead of a graph hop.
 */
export async function getRulesByTags(tags: string[]): Promise<PrismRuleRow[]> {
  if (tags.length === 0) return [];
  const db = getPrismDb();
  const { data, error } = await db
    .from("prism_rules")
    .select("*")
    .overlaps("tags", tags);
  if (error) throw error;
  return (data as PrismRuleRow[]) || [];
}

/**
 * Get the ids of rules that share at least one tag with `tags`, excluding
 * `excludeRuleId`. Used by the gremlin-ranking boost (tag-overlap signal).
 */
export async function getTagOverlapRuleIds(
  tags: string[],
  excludeRuleId?: string,
): Promise<string[]> {
  if (tags.length === 0) return [];
  const db = getPrismDb();
  let query = db.from("prism_rules").select("id").overlaps("tags", tags);
  if (excludeRuleId) query = query.neq("id", excludeRuleId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((r: { id: string }) => r.id);
}
