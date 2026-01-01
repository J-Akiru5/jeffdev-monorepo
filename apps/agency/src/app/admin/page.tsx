import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  FolderKanban,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  Users,
  Globe,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { getQuotes, getMessages, getProjects } from '@/lib/data';
import { getAuditLogs } from '@/lib/audit';
import { getCalendarEvents } from '@/app/actions/calendar';

/**
 * Admin Dashboard
 * ----------------
 * Revamped overview with analytics, upcoming meetings, and quick actions.
 */

import { getAnalyticsMetrics } from '@/lib/google-analytics';

// ... (imports)

export default async function AdminDashboardPage() {
  // Fetch data for metrics
  const [quotes, messages, projects, auditLogs, calendarEvents, analytics] = await Promise.all([
    getQuotes(),
    getMessages(),
    getProjects(),
    getAuditLogs(10),
    getCalendarEvents(),
    getAnalyticsMetrics(),
  ]);

  // Calculate metrics
  const newQuotes = quotes.filter((q) => q.status === 'new').length;
  const newMessages = messages.filter((m) => m.status === 'new').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const pendingProjects = projects.filter((p) => p.status === 'pending').length;

  // Recent activity (last 24 hours)
  // Note: Using a stable date calculation for server component
  const recentActivity = auditLogs.filter((log) => {
    const logDate = new Date(log.timestamp);
    const dayAgo = new Date();
    dayAgo.setHours(dayAgo.getHours() - 24);
    return logDate > dayAgo;
  }).length;

  // Upcoming events (next 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = calendarEvents
    .filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= now && eventDate <= sevenDaysFromNow;
    })
    .slice(0, 5);

  return (
    <div>
      {/* ... (header) */}

      {/* Analytics Row (NEW - Priority) */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <AnalyticsCard
          title="Page Views (24h)"
          value={analytics.screenPageViews24h}
          change={analytics.screenPageViews24h === '0' || analytics.screenPageViews24h === '—' ? undefined : '+20%'} // Placeholder trend for now
          icon={BarChart3}
          note="Google Analytics 4"
        />
        <AnalyticsCard
          title="Unique Visitors (7d)"
          value={analytics.uniqueVisitors7d}
          change={analytics.uniqueVisitors7d === '0' || analytics.uniqueVisitors7d === '—' ? undefined : '+15%'}
          icon={Users}
          note="Active Users"
        />
        <AnalyticsCard
          title="Top Traffic Source"
          value={analytics.topCountry}
          icon={Globe}
          note="Global Reach"
        />
      </div>


      {/* Main Metrics Grid */}
      {/* Main Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Quotes */}
        <MetricCard
          title="Quote Requests"
          value={quotes.length}
          badge={newQuotes > 0 ? `${newQuotes} new` : undefined}
          href="/admin/quotes"
          icon={MessageSquare}
          color="purple"
        />

        {/* Messages */}
        <MetricCard
          title="Messages"
          value={messages.length}
          badge={newMessages > 0 ? `${newMessages} unread` : undefined}
          href="/admin/messages"
          icon={Mail}
          color="cyan"
        />

        {/* Active Projects */}
        <MetricCard
          title="Active Projects"
          value={activeProjects}
          subtitle={`${pendingProjects} pending`}
          href="/admin/projects"
          icon={FolderKanban}
          color="emerald"
        />

        {/* Recent Activity */}
        <MetricCard
          title="Recent Activity"
          value={recentActivity}
          subtitle="Last 24 hours"
          href="/admin/audit"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Secondary Row - Recent Quotes (Priority) + Upcoming Meetings */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Quotes - Takes 2 columns */}
        <div className="rounded-md border border-white/8 bg-white/2 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Quotes</h2>
            <Link
              href="/admin/quotes"
              className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {quotes.slice(0, 5).map((quote) => (
              <Link
                key={quote.id}
                href={`/admin/quotes?id=${quote.id}`}
                className="flex items-center justify-between rounded-md bg-white/2 p-3 transition-all hover:bg-white/5"
              >
                <div>
                  <div className="text-sm font-medium text-white">{quote.name}</div>
                  <div className="text-xs text-white/40">{quote.projectType} • {quote.budget}</div>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${quote.status === 'new'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : quote.status === 'contacted'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-white/10 text-white/40'
                    }`}
                >
                  {quote.status}
                </span>
              </Link>
            ))}
            {quotes.length === 0 && (
              <p className="text-sm text-white/30">No quotes yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Upcoming Schedule</h2>
            <Link
              href="/admin/calendar"
              className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white"
            >
              Calendar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-md bg-white/2 p-3"
              >
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${event.type === 'deadline'
                    ? 'bg-red-400'
                    : event.type === 'meeting'
                      ? 'bg-cyan-400'
                      : event.type === 'milestone'
                        ? 'bg-purple-400'
                        : 'bg-white/40'
                    }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{event.title}</div>
                  <div className="text-xs text-white/40">
                    {new Date(event.start).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {event.type === 'meeting' && !event.allDay && (
                      <span className="ml-1">
                        at {new Date(event.start).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-white/30">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links (Minimized) */}
      <div className="mt-6 flex flex-wrap gap-2">
        <QuickLink href="/admin/invoices/new" icon={Receipt} label="New Invoice" />
        <QuickLink href="/admin/calendar" icon={Calendar} label="Calendar" />
        <QuickLink href="/admin/projects" icon={FolderKanban} label="Projects" />
        <QuickLink href="/" icon={ExternalLink} label="View Site" external />
      </div>
    </div>
  );
}

// ---------- Components ----------

interface AnalyticsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
}

function AnalyticsCard({ title, value, change, icon: Icon, note }: AnalyticsCardProps) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-wider">{title}</span>
        <Icon className="h-4 w-4 text-white/20" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change && (
          <span className={`text-xs ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
      {note && <p className="mt-1 text-[10px] text-white/30">{note}</p>}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  badge?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'purple' | 'cyan' | 'emerald' | 'orange';
}

function MetricCard({
  title,
  value,
  subtitle,
  badge,
  href,
  icon: Icon,
  color,
}: MetricCardProps) {
  const colorClasses = {
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  };

  return (
    <Link
      href={href}
      className="group rounded-md border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-md border p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span className="rounded-sm bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="mt-1 text-sm text-white/50">{title}</div>
        {subtitle && <div className="text-xs text-white/30">{subtitle}</div>}
      </div>
    </Link>
  );
}

interface QuickLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}

function QuickLink({ href, icon: Icon, label, external }: QuickLinkProps) {
  const Component = external ? 'a' : Link;
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Component
      href={href}
      className="inline-flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/50 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
      {...props}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Component>
  );
}
