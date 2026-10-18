"use server";

/**
 * Platform Audit Log Server Actions
 * ----------------------------------
 * Paginated, filterable queries for the platform-wide audit viewer.
 * Uses requireRole() for authorization — the existing audit infrastructure
 * (audit_logs table + logAuditEvent) is the single source of truth.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/authz";
import type { AuditLogRow } from "@/lib/database.types";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actorEmail: string;
  actorId: string | null;
  actorRole: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditPage {
  entries: AuditEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuditFilters {
  action?: string;
  resource?: string;
  actor?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "access_token",
  "refresh_token",
  "api_key",
  "service_role_key",
  "secret",
  "authorization",
  "cookie",
  "token",
]);

function sanitizeDetails(
  changes: unknown,
): Record<string, unknown> | null {
  if (!changes || typeof changes !== "object") return null;
  const obj = changes as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = "[complex]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function rowToEntry(row: AuditLogRow): AuditEntry {
  const changes = (row.changes as Record<string, unknown>) || {};
  return {
    id: row.id,
    timestamp: row.created_at,
    action: row.action,
    resourceType: row.resource_type || "unknown",
    resourceId: row.resource_id || "",
    actorEmail: (changes.userEmail as string) || "unknown",
    actorId: (changes.actorId as string) || null,
    actorRole: (changes.actorRole as string) || null,
    details: sanitizeDetails(changes),
    ipAddress: row.ip_address as string | null,
    userAgent: row.user_agent,
  };
}

/**
 * Fetch a paginated, filterable page of audit logs.
 * Requires manager+ role (matching the existing agency audit access level).
 */
export async function getPlatformAuditLogs(
  filters: AuditFilters = {},
): Promise<AuditPage> {
  await requireRole("founder");

  const supabase = getAdminClient();
  const limit = Math.min(filters.limit ?? 50, 100);

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (filters.action) {
    query = query.eq("action", filters.action);
  }
  if (filters.resource) {
    query = query.eq("resource_type", filters.resource);
  }
  if (filters.cursor) {
    query = query.lt("created_at", filters.cursor);
  }
  if (filters.actor) {
    query = query.ilike("changes->>userEmail", `%${filters.actor}%`);
  }
  if (filters.search) {
    query = query.or(
      `resource_type.ilike.%${filters.search}%,resource_id.ilike.%${filters.search}%,action.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("[PLATFORM AUDIT ERROR]", error);
    return { entries: [], nextCursor: null, hasMore: false };
  }

  const rows = data as AuditLogRow[];
  const hasMore = rows.length > limit;
  const entries = rows.slice(0, limit).map(rowToEntry);
  const nextCursor = hasMore ? entries[entries.length - 1]?.timestamp ?? null : null;

  return { entries, nextCursor, hasMore };
}
