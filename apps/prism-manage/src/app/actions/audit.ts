"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Fetch recent audit logs for the current user's workspace.
 * Uses the admin client (service_role) to bypass RLS.
 * Returns paginated results ordered by most recent first.
 */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  logs: AuditLogEntry[];
  total: number;
}> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { logs: [], total: 0 };

    const adminClient = getAdminClient();

    // Get total count
    const { count: total } = await adminClient
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .order("created_at", { ascending: false });

    // Fetch paginated logs
    const { data: logs } = await adminClient
      .from("audit_logs")
      .select("id, action, resource_type, resource_id, changes, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      logs: (logs || []).map((log: Record<string, unknown>) => ({
        id: String(log.id),
        action: String(log.action),
        resourceType: log.resource_type ? String(log.resource_type) : "unknown",
        resourceId: log.resource_id ? String(log.resource_id) : null,
        changes: log.changes ? (log.changes as Record<string, unknown>) : null,
        createdAt: String(log.created_at),
      })),
      total: total ?? 0,
    };
  } catch {
    return { logs: [], total: 0 };
  }
}
