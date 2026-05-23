/**
 * Audit Logging System
 * ---------------------
 * Logs all admin actions to Supabase for compliance and debugging.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

export interface AuditEvent {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  resource: 'services' | 'projects' | 'quotes' | 'messages' | 'calendar_events' | 'invoices' | 'subscriptions' | 'users' | 'feedback' | 'case_study';
  resourceId: string;
  details?: Record<string, unknown>;
  userEmail?: string;
  timestamp?: string;
}

export interface AuditLog extends AuditEvent {
  id: string;
  timestamp: string;
  userEmail?: string;
}

/**
 * Log an audit event to Supabase
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = getAdminClient();

    const payload: Record<string, unknown> = {
      action: event.action,
      resource_type: event.resource,
      resource_id: event.resourceId,
      changes: {
        ...(event.details || {}),
        userEmail: event.userEmail || 'admin@jeffdev.studio',
      },
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('audit_logs').insert([payload] as any);

    if (error) {
      console.error('[AUDIT DB ERROR]', error);
      return;
    }

    console.log(`[AUDIT] ${event.action} ${event.resource}/${event.resourceId}`);
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('[AUDIT ERROR]', error);
  }
}

/**
 * Fetch recent audit logs
 */
export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as Database['public']['Tables']['audit_logs']['Row'][]).map((row) => ({
      id: row.id,
      action: row.action as AuditEvent['action'],
      resource: (row.resource_type || 'users') as AuditEvent['resource'],
      resourceId: row.resource_id || '',
      details: (row.changes as Record<string, unknown>) || undefined,
      userEmail: ((row.changes as Record<string, unknown>)?.userEmail as string) || 'unknown',
      timestamp: row.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('[GET AUDIT LOGS ERROR]', error);
    return [];
  }
}
