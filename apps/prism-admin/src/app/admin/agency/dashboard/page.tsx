import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MessageSquare,
  Mail,
  FolderKanban,
  Receipt,
  ArrowUpRight,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";

/**
 * Agency Dashboard
 * -----------------
 * Overview with analytics, upcoming events, and quick actions.
 */

export default async function AgencyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch agency data from Supabase
  const [
    { data: quotes },
    { data: messages },
    { data: projects },
    { data: calendarEvents },
  ] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .lte(
        "start_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("start_time", { ascending: true })
      .limit(5),
  ]);

  const newQuotes =
    quotes?.filter((q) => q.status === "new" || q.status === "reviewed")
      .length || 0;
  const newMessages =
    messages?.filter((m) => m.status === "unread").length || 0;
  const activeProjects =
    projects?.filter((p) => p.status === "active").length || 0;
  const totalProjects = projects?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agency Dashboard</h1>
          <p className="text-sm text-white/50">Syntaxure Labs Overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Quote Requests"
          value={quotes?.length || 0}
          badge={newQuotes > 0 ? `${newQuotes} new` : undefined}
          href="/admin/agency/quotes"
          icon={MessageSquare}
          color="purple"
        />
        <MetricCard
          title="Messages"
          value={messages?.length || 0}
          badge={newMessages > 0 ? `${newMessages} unread` : undefined}
          href="/admin/agency/messages"
          icon={Mail}
          color="cyan"
        />
        <MetricCard
          title="Active Projects"
          value={activeProjects}
          subtitle={`${totalProjects} total`}
          href="/admin/agency/projects"
          icon={FolderKanban}
          color="emerald"
        />
        <MetricCard
          title="Invoices"
          value={0}
          subtitle="Manage billing"
          href="/admin/agency/invoices"
          icon={Receipt}
          color="orange"
        />
      </div>

      {/* Secondary Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Quotes */}
        <div className="lg:col-span-2 rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Quotes</h2>
            <Link
              href="/admin/agency/quotes"
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {quotes?.slice(0, 5).map((quote) => (
              <Link
                key={quote.id}
                href={`/admin/agency/quotes?id=${quote.id}`}
                className="flex items-center justify-between rounded-md bg-white/[0.02] p-3 hover:bg-white/5 transition-all"
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {quote.title}
                  </div>
                  <div className="text-xs text-white/40">
                    {(quote as { client_id?: string }).client_id ? "Client" : "Client"} &middot; $
                    {(quote as { amount?: number }).amount || 0}
                  </div>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    quote.status === "responded"
                      ? "bg-cyan-500/10 text-cyan-400"
                      : quote.status === "accepted"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {quote.status}
                </span>
              </Link>
            ))}
            {(!quotes || quotes.length === 0) && (
              <p className="text-sm text-white/30">No quotes yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Upcoming Schedule
            </h2>
            <Link
              href="/admin/agency/calendar"
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
            >
              Calendar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {calendarEvents?.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-md bg-white/[0.02] p-3"
              >
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${
                    event.event_type === "deadline"
                      ? "bg-red-400"
                      : event.event_type === "meeting"
                        ? "bg-cyan-400"
                        : "bg-white/40"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {event.title}
                  </div>
                  <div className="text-xs text-white/40">
                    {new Date(event.start_time).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            ))}
            {(!calendarEvents || calendarEvents.length === 0) && (
              <p className="text-sm text-white/30">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <QuickLink
          href="/admin/agency/projects"
          icon={FolderKanban}
          label="Projects"
        />
        <QuickLink
          href="/admin/agency/calendar"
          icon={Calendar}
          label="Calendar"
        />
        <QuickLink href="/admin/agency/users" icon={Users} label="Users" />
        <QuickLink
          href="/admin/agency/settings"
          icon={BarChart3}
          label="Settings"
        />
      </div>
    </div>
  );
}

// ---------- Components ----------

function MetricCard({
  title,
  value,
  subtitle,
  badge,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  badge?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "purple" | "cyan" | "emerald" | "orange";
}) {
  const colorClasses = {
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  };

  return (
    <Link
      href={href}
      className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-md border p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {badge && (
          <span className="rounded-sm bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="mt-1 text-xs text-white/50">{title}</div>
        {subtitle && (
          <div className="text-[10px] text-white/30">{subtitle}</div>
        )}
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs text-white/50 hover:border-white/10 hover:bg-white/[0.04] hover:text-white transition-all"
    >
      <Icon className="h-3 w-3" />
      {label}
    </Link>
  );
}
