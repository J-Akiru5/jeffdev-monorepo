import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { getAuditLogs } from "@/lib/audit";

/**
 * Agency Audit Log Page
 * ----------------------
 * View system audit logs for compliance and debugging.
 */

const actionColors: Record<string, string> = {
  CREATE: "text-emerald-400 bg-emerald-500/10",
  UPDATE: "text-blue-400 bg-blue-500/10",
  DELETE: "text-red-400 bg-red-500/10",
  STATUS_CHANGE: "text-amber-400 bg-amber-500/10",
};

const resourceIcons: Record<string, string> = {
  projects: "📋",
  invoices: "📄",
  users: "👤",
  quotes: "💬",
  messages: "✉️",
  feedback: "⭐",
  services: "⚙️",
  case_study: "📚",
  calendar_events: "📅",
  subscriptions: "🔄",
};

export default async function AgencyAuditPage() {
  const logs = await getAuditLogs(50);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-white/50">
          {logs.length} recent events · System activity log
        </p>
      </div>

      <div className="space-y-2">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{resourceIcons[log.resource] || "📌"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono ${
                          actionColors[log.action] || "text-white/40 bg-white/10"
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-xs text-white/60 font-mono">
                        {log.resource}/{log.resourceId.substring(0, 8)}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {JSON.stringify(log.details).substring(0, 80)}
                        {JSON.stringify(log.details).length > 80 ? "..." : ""}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-white/30 shrink-0 ml-4">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">
            <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>No audit logs yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
