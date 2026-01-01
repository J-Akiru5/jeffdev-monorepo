import Link from 'next/link';
import { ArrowLeft, Activity, Clock, User, FileText } from 'lucide-react';
import { getAuditLogs } from '@/lib/audit';

/**
 * Admin Audit Log Page
 * --------------------
 * View all admin actions for compliance and debugging.
 */

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  userEmail: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/20 text-emerald-400',
  UPDATE: 'bg-cyan-500/20 text-cyan-400',
  DELETE: 'bg-red-500/20 text-red-400',
  STATUS_CHANGE: 'bg-purple-500/20 text-purple-400',
};

export default async function AdminAuditPage() {
  const logs = (await getAuditLogs(100)) as AuditLog[];

  return (
    <div className="min-h-screen bg-void px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <div className="rounded-md border border-white/10 bg-white/5 p-2">
            <Activity className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Audit Log</h1>
            <p className="mt-1 text-white/50">{logs.length} recent actions</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="mt-12 rounded-md border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <p className="text-white/40">No audit logs yet</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-4"
              >
                {/* Action Badge */}
                <span
                  className={`inline-flex min-w-[100px] justify-center rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${actionColors[log.action] || 'bg-white/10 text-white/40'}`}
                >
                  {log.action.replace('_', ' ')}
                </span>

                {/* Resource */}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white/40" />
                  <span className="font-mono text-sm text-white">
                    {log.resource}/{log.resourceId}
                  </span>
                </div>

                {/* Details */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="text-xs text-white/40">
                    {Object.entries(log.details)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.userEmail.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
