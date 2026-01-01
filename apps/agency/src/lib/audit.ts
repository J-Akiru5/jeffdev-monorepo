/**
 * Audit Logging System
 * ---------------------
 * Logs all admin actions to Firestore for compliance and debugging.
 */

import { db } from '@/lib/firebase/admin';

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
  userEmail: string;
}

/**
 * Log an audit event to Firestore
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const auditLog = {
      ...event,
      timestamp: new Date().toISOString(),
      // userEmail would come from session in a real implementation
      userEmail: event.userEmail || 'admin@jeffdev.studio',
    };

    await db.collection('audit_logs').add(auditLog);
    
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
    const snapshot = await db
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error('[GET AUDIT LOGS ERROR]', error);
    return [];
  }
}

