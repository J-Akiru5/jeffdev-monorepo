/**
 * Audit Logging System (Manage)
 * ------------------------------
 * Logs user actions to Supabase's `audit_logs` table for traceability.
 * Uses the browser Supabase client (RLS-protected).
 *
 * This is a lightweight client-side audit system. For sensitive server-side
 * operations, use the admin-level audit utilities in prism-admin.
 */

import { createClient } from "@/lib/supabase/browser";

export interface AuditEvent {
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "TOGGLE";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Log an audit event to Supabase.
 * Fails silently so the main operation is never blocked by audit logging.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("audit_logs").insert({
      action: event.action,
      resource_type: event.resource,
      resource_id: event.resourceId || null,
      changes: event.details || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[AUDIT] DB insert failed (will not block user action):", error.message);
      return;
    }

    console.log(`[AUDIT] ${event.action} ${event.resource}${event.resourceId ? `/${event.resourceId}` : ""}`);
  } catch (error) {
    // Never throw — audit is non-critical
    console.warn("[AUDIT] Unexpected error (will not block user action):", error);
  }
}
