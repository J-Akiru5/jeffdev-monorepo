"use client";

/**
 * PortfolioView (/portfolio)
 * -------------------------
 * Client shell for the portfolio list: stats, client-side filters (the URL is
 * intentionally not involved in v1), the responsive project-card grid and the
 * founder-only create dialog. Data arrives pre-fetched from the server page and
 * amounts are already redacted server-side for non-founders.
 */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Plus,
  Search,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { EmptyState, ProgressBar } from "@syntaxure/ui";
import {
  matchesPortfolioFilters,
  retainerLabel,
  type PortfolioDashboardData,
  type PortfolioFilters,
  type PortfolioKind,
  type PortfolioProjectSummary,
  type PortfolioStatus,
  type RetainerStatus,
} from "@/lib/portfolio";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { CreateProjectDialog } from "./create-project-dialog";
import { PortfolioTabs } from "./portfolio-tabs";
import {
  externalHref,
  formatMoney,
  formatMoneyMap,
  formatPortfolioDate,
  initialsFor,
  KIND_LABELS,
  KIND_OPTIONS,
  KIND_STYLES,
  MEMBER_ROLE_LABELS,
  PRIMARY_BUTTON_CLASS,
  RETAINER_LABELS,
  RETAINER_OPTIONS,
  RETAINER_STYLES,
  SECTION_CLASS,
  SELECT_CLASS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_SORT,
  STATUS_STYLES,
} from "./portfolio-constants";

interface PortfolioViewProps {
  data: PortfolioDashboardData;
}

export function PortfolioView({ data }: PortfolioViewProps) {
  const userRole = useWorkspaceStore((state) => state.userRole);
  const isFounder = userRole === "founder";

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<PortfolioKind | "">("");
  const [status, setStatus] = useState<PortfolioStatus | "">("");
  const [retainer, setRetainer] = useState<RetainerStatus | "">("");
  const [partnerId, setPartnerId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const hasActiveFilters = Boolean(
    search.trim() || kind || status || retainer || partnerId || memberId,
  );

  const filters = useMemo<PortfolioFilters>(
    () => ({
      search: search.trim() || undefined,
      kind: kind || undefined,
      portfolioStatus: status || undefined,
      retainerStatus: retainer || undefined,
      partnerId: partnerId || undefined,
      memberId: memberId || undefined,
    }),
    [search, kind, status, retainer, partnerId, memberId],
  );

  const projects = useMemo(
    () =>
      data.projects
        .filter((project) => matchesPortfolioFilters(project, filters))
        .sort(
          (a, b) =>
            STATUS_SORT[a.portfolioStatus] - STATUS_SORT[b.portfolioStatus] ||
            a.title.localeCompare(b.title),
        ),
    [data.projects, filters],
  );

  const memberOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const project of data.projects) {
      for (const member of project.members) {
        if (!seen.has(member.userId)) seen.set(member.userId, member.name);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data.projects]);

  const stats = data.stats;
  const hasMrr = Object.keys(stats.activeMrr).length > 0;

  const clearFilters = () => {
    setSearch("");
    setKind("");
    setStatus("");
    setRetainer("");
    setPartnerId("");
    setMemberId("");
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="mt-1 text-sm text-white/40">
            Every venture, client engagement and internal build in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PortfolioTabs />
          {isFounder && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={PRIMARY_BUTTON_CLASS}
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Projects"
          value={String(stats.total)}
        />
        <StatCard
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          label="Ventures"
          value={String(stats.ventures)}
        />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="Clients"
          value={String(stats.clients)}
        />
        <StatCard
          icon={<Wrench className="h-4 w-4" />}
          label="In maintenance"
          value={String(stats.maintenance)}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed"
          value={String(stats.completed)}
        />
        {hasMrr && (
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Active MRR"
            value={formatMoneyMap(stats.activeMrr)}
            wide
          />
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects, clients, partners…"
            className="h-9 w-full rounded-lg border border-border bg-glass-04 pl-9 pr-3 text-sm text-white/70 outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50"
          />
        </div>

        <select
          aria-label="Filter by kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as PortfolioKind | "")}
          className={SELECT_CLASS}
        >
          <option value="">All kinds</option>
          {KIND_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {KIND_LABELS[option]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as PortfolioStatus | "")
          }
          className={SELECT_CLASS}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by retainer"
          value={retainer}
          onChange={(event) =>
            setRetainer(event.target.value as RetainerStatus | "")
          }
          className={SELECT_CLASS}
        >
          <option value="">All retainers</option>
          {RETAINER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {RETAINER_LABELS[option]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by partner"
          value={partnerId}
          onChange={(event) => setPartnerId(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">All partners</option>
          {data.partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by assignee"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">All assignees</option>
          {memberOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-white/40 transition-colors hover:border-border-active hover:text-white/70"
            title="Clear filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Cards */}
      {projects.length === 0 ? (
        <div className={SECTION_CLASS}>
          <EmptyState
            icon={<BriefcaseBusiness className="h-6 w-6 text-white/20" />}
            title={hasActiveFilters ? "No matching projects" : "No projects yet"}
            description={
              hasActiveFilters
                ? "Nothing matches the current filters. Clear them to see the full portfolio."
                : isFounder
                  ? "Create the first project to start tracking progress, retainers and partners."
                  : "Once a founder adds a project it will appear here."
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-border px-3.5 py-2 text-sm text-white/60 transition-colors hover:border-border-active hover:text-white/80"
                >
                  Clear filters
                </button>
              ) : isFounder ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  <Plus className="h-4 w-4" />
                  New project
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-white/30">
        {projects.length} of {data.projects.length} project
        {data.projects.length === 1 ? "" : "s"} shown
      </p>

      {isFounder && (
        <CreateProjectDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  wide,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border glass-subtle p-3 ${
        wide ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-cyan-400/80">
        {icon}
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-white/40">
          {label}
        </span>
      </div>
      <p className="truncate text-lg font-semibold text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function ProjectCard({ project }: { project: PortfolioProjectSummary }) {
  const endDate = formatPortfolioDate(project.endDate);
  const startDate = formatPortfolioDate(project.startDate);
  const updatedAt = formatPortfolioDate(project.updatedAt);

  const dateLabel = endDate
    ? `Ends ${endDate}`
    : startDate
      ? `Started ${startDate}`
      : updatedAt
        ? `Updated ${updatedAt}`
        : null;

  const visibleMembers = project.members.slice(0, 4);
  const extraMembers = project.members.length - visibleMembers.length;

  return (
    <article className="group relative flex flex-col gap-2.5 rounded-xl border border-border glass-subtle p-4 transition-colors hover:border-border-active">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${KIND_STYLES[project.kind]}`}
        >
          {KIND_LABELS[project.kind]}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[project.portfolioStatus]}`}
          >
            {STATUS_LABELS[project.portfolioStatus]}
          </span>
          {project.publishedSiteUrl && (
            <a
              href={externalHref(project.publishedSiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.title} live site`}
              title={project.publishedSiteUrl}
              className="relative z-10 rounded p-1 text-white/30 transition-colors hover:text-cyan-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-white">
          <Link
            href={`/portfolio/${project.id}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-cyan-300"
          >
            {project.title}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-xs text-white/40">
          {project.client
            ? project.client.company
              ? `${project.client.name} · ${project.client.company}`
              : project.client.name
            : "Own venture"}
          {project.category ? ` · ${project.category}` : ""}
        </p>
      </div>

      {project.partners.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.partners.map((partner) => (
            <span
              key={partner.id}
              title={partner.role ?? partner.name}
              className="max-w-[10rem] truncate rounded-full border border-border bg-glass-04 px-1.5 py-0.5 text-[10px] text-white/50"
            >
              {partner.name}
            </span>
          ))}
        </div>
      )}

      {(project.retainer.status !== "none" ||
        project.retainer.monthlyAmount !== null) && (
        <div className="flex flex-wrap items-center gap-2">
          {project.retainer.status !== "none" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${RETAINER_STYLES[project.retainer.status]}`}
            >
              {retainerLabel(project.retainer.status)}
            </span>
          )}
          {project.retainer.monthlyAmount !== null && (
            <span className="font-mono text-[11px] text-white/50">
              {formatMoney(
                project.retainer.monthlyAmount,
                project.retainer.currency,
              )}
              /mo
            </span>
          )}
        </div>
      )}

      <ProgressBar value={project.progress ?? 0} size="sm" showLabel />

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center -space-x-1.5">
          {visibleMembers.map((member) => (
            <span
              key={member.userId}
              title={`${member.name} — ${MEMBER_ROLE_LABELS[member.role]}`}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-mono text-[9px] text-white/60"
            >
              {initialsFor(member.name)}
            </span>
          ))}
          {extraMembers > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-[9px] text-white/40">
              +{extraMembers}
            </span>
          )}
          {project.members.length === 0 && (
            <span className="text-[10px] text-white/25">Unassigned</span>
          )}
        </div>
        {dateLabel && (
          <span className="truncate text-[10px] text-white/30">{dateLabel}</span>
        )}
      </div>
    </article>
  );
}
