import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/agency/dashboard/charts
 * Returns chart data for the agency dashboard (revenue, project statuses, activity)
 */
export async function GET() {
  const supabase = getAdminClient();

  // Project statuses
  const { data: projects } = await supabase
    .from("projects")
    .select("status, budget, created_at, metadata");

  const projectStatuses: Record<string, number> = {};
  for (const p of projects || []) {
    const key = p.status ?? "unknown";
    projectStatuses[key] = (projectStatuses[key] || 0) + 1;
  }

  // Monthly revenue (from invoices)
  const { data: invoices } = await supabase
    .from("invoices")
    .select("total_amount, created_at, status")
    .in("status", ["sent", "paid"])
    .order("created_at", { ascending: true });

  const monthlyRevenue: Record<string, number> = {};
  for (const inv of invoices || []) {
    const month = (inv.created_at || "").slice(0, 7); // YYYY-MM
    if (month) {
      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + parseFloat(inv.total_amount || "0");
    }
  }

  // Recent activity from audit logs
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("created_at, action, resource_type, resource_id")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
      month,
      amount,
    })),
    projectStatuses: Object.entries(projectStatuses).map(([status, count]) => ({
      status,
      count,
    })),
    recentActivity: (auditLogs || []).map((log) => ({
      date: log.created_at,
      action: log.action,
      resource: `${log.resource_type}/${log.resource_id}`,
    })),
  });
}
