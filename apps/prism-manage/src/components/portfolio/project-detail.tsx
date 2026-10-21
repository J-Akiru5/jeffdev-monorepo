"use client";

/**
 * ProjectDetail (/portfolio/[id])
 * -------------------------------
 * One project, wired to the Phase 1 actions. Amounts arrive already redacted
 * for non-founders, so this component only decides what to *show*, never what
 * to hide from the network response:
 *
 *   - founders: everything, plus team/partner/milestone writes
 *   - assigned members: progress + milestones
 *   - everyone else: read-only
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  Handshake,
  Link2,
  ListChecks,
  Loader,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ConfirmDialog, ProgressBar } from "@syntaxure/ui";
import {
  archivePortfolioProject,
  deleteProjectMilestone,
  removeProjectMember,
  removeProjectPartner,
  setProjectMilestoneStatus,
  updatePortfolioProgress,
} from "@/app/actions/portfolio";
import {
  canUpdateProjectProgress,
  daysUntilRenewal,
  retainerLabel,
  type MilestoneStatus,
  type PortfolioMilestone,
  type PortfolioPartnerSummary,
  type PortfolioProjectDetail,
} from "@/lib/portfolio";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { MemberDialog } from "./member-dialog";
import { MilestoneDialog } from "./milestone-dialog";
import { PartnerLinkDialog } from "./partner-link-dialog";
import { ProjectDialog } from "./create-project-dialog";
import {
  externalHref,
  formatMoney,
  formatPortfolioDate,
  initialsFor,
  KIND_LABELS,
  KIND_STYLES,
  MEMBER_ROLE_LABELS,
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_OPTIONS,
  MILESTONE_STATUS_STYLES,
  PARTNER_KIND_LABELS,
  RETAINER_STYLES,
  SECTION_CLASS,
  SMALL_GHOST_BUTTON_CLASS,
  STATUS_LABELS,
  STATUS_STYLES,
} from "./portfolio-constants";

interface ProjectDetailProps {
  project: PortfolioProjectDetail;
  partners: PortfolioPartnerSummary[];
  currentUserId: string | null;
}

export function ProjectDetail({
  project,
  partners,
  currentUserId,
}: ProjectDetailProps) {
  const router = useRouter();
  const userRole = useWorkspaceStore((state) => state.userRole);
  const isFounder = userRole === "founder";
  const isAssigned = currentUserId
    ? project.members.some((member) => member.userId === currentUserId)
    : false;
  const canUpdateProgress = canUpdateProjectProgress(userRole, isAssigned);

  const [progress, setProgress] = useState(project.progress ?? 0);
  const [savingProgress, setSavingProgress] = useState(false);

  const [memberOpen, setMemberOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [removePartnerId, setRemovePartnerId] = useState<string | null>(null);
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null);

  useEffect(() => {
    setProgress(project.progress ?? 0);
  }, [project.progress]);

  const refresh = () => router.refresh();

  const savedProgress = project.progress ?? 0;

  const handleSaveProgress = async () => {
    setSavingProgress(true);
    try {
      const result = await updatePortfolioProgress(project.id, progress);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Progress set to ${progress}%`);
      refresh();
    } catch {
      toast.error("Failed to update progress");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleToggleMilestone = async (milestone: PortfolioMilestone) => {
    const next = milestone.status === "completed" ? "pending" : "completed";
    try {
      const result = await setProjectMilestoneStatus(milestone.id, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      refresh();
    } catch {
      toast.error("Failed to update milestone");
    }
  };

  /** Explicit status pick from the row select (pending / in progress / …). */
  const handleMilestoneStatus = async (
    milestone: PortfolioMilestone,
    status: MilestoneStatus,
  ) => {
    if (status === milestone.status) return;
    try {
      const result = await setProjectMilestoneStatus(milestone.id, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${milestone.title} · ${MILESTONE_STATUS_LABELS[status]}`);
      refresh();
    } catch {
      toast.error("Failed to update milestone");
    }
  };

  const handleArchive = async () => {
    try {
      const result = await archivePortfolioProject(project.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${project.title}" archived`);
      refresh();
      router.push("/portfolio");
    } catch {
      toast.error("Failed to archive project");
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    const result = await removeProjectMember(project.id, removeMemberId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Member removed");
    refresh();
  };

  const handleRemovePartner = async () => {
    if (!removePartnerId) return;
    const result = await removeProjectPartner(project.id, removePartnerId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Partner unlinked");
    refresh();
  };

  const handleDeleteMilestone = async () => {
    if (!deleteMilestoneId) return;
    const result = await deleteProjectMilestone(deleteMilestoneId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Milestone deleted");
    refresh();
  };

  const renewalDays = daysUntilRenewal(project.retainer.renewsOn);
  const renewalHint =
    renewalDays === null
      ? null
      : renewalDays === 0
        ? "Renews today"
        : renewalDays > 0
          ? `Renews in ${renewalDays} day${renewalDays === 1 ? "" : "s"}`
          : `${Math.abs(renewalDays)} day${Math.abs(renewalDays) === 1 ? "" : "s"} overdue`;

  const removeMember = project.members.find(
    (member) => member.userId === removeMemberId,
  );
  const removePartner = project.partners.find(
    (partner) => partner.id === removePartnerId,
  );
  const deleteMilestone = project.milestones.find(
    (milestone) => milestone.id === deleteMilestoneId,
  );

  const budgetCurrency = project.retainer.currency || "PHP";

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/portfolio"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Portfolio
      </Link>

      {/* Header */}
      <header className="mb-5 rounded-xl border border-border glass-subtle p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${KIND_STYLES[project.kind]}`}
              >
                {KIND_LABELS[project.kind]}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[project.portfolioStatus]}`}
              >
                {STATUS_LABELS[project.portfolioStatus]}
              </span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                  project.published
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-white/10 text-white/40"
                }`}
              >
                <Globe className="h-3 w-3" />
                {project.published ? "Published" : "Not published"}
              </span>
              {project.publishedSiteUrl && (
                <a
                  href={externalHref(project.publishedSiteUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-cyan-400 transition-colors hover:border-cyan-500/40"
                >
                  Live site
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <h1 className="break-words text-2xl font-bold text-white">
              {project.title}
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {project.client
                ? project.client.company
                  ? `${project.client.name} · ${project.client.company}`
                  : project.client.name
                : "Own venture"}
              {project.category ? ` · ${project.category}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-[10px] text-white/30 sm:items-end">
            {isFounder && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className={SMALL_GHOST_BUTTON_CLASS}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveOpen(true)}
                  className={`${SMALL_GHOST_BUTTON_CLASS} hover:text-rose-300`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
              </div>
            )}
            <span>Created {formatPortfolioDate(project.createdAt) ?? "—"}</span>
            <span>Updated {formatPortfolioDate(project.updatedAt) ?? "—"}</span>
            {project.slug && <span className="font-mono">/{project.slug}</span>}
          </div>
        </div>

        {project.partners.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.partners.map((partner) => (
              <span
                key={partner.id}
                title={partner.role ?? partner.name}
                className="rounded-full border border-border bg-glass-04 px-2 py-0.5 text-[10px] text-white/50"
              >
                {partner.name}
                {partner.role ? ` · ${partner.role}` : ""}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Progress */}
          <section className={SECTION_CLASS}>
            <SectionHeader
              title="Progress"
              action={
                <span className="font-mono text-xs text-white/40">
                  {savedProgress}% saved
                </span>
              }
            />
            {canUpdateProgress ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={progress}
                    aria-label="Project progress"
                    onChange={(event) => setProgress(Number(event.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-500"
                  />
                  <span className="w-10 text-right font-mono text-sm text-white/70">
                    {progress}%
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleSaveProgress()}
                    disabled={savingProgress || progress === savedProgress}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingProgress && <Loader className="h-3 w-3 animate-spin" />}
                    Save
                  </button>
                </div>
                <ProgressBar value={progress} size="sm" showLabel={false} />
              </div>
            ) : (
              <div className="mt-4">
                <ProgressBar value={savedProgress} />
                <p className="mt-2 text-[11px] text-white/30">
                  Only founders and members assigned to this project can move
                  the bar.
                </p>
              </div>
            )}
          </section>

          {/* Details */}
          <section className={SECTION_CLASS}>
            <SectionHeader title="Details" />
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <DetailCell label="Category" value={project.category ?? "—"} />
              <DetailCell
                label="Start"
                value={formatPortfolioDate(project.startDate) ?? "—"}
              />
              <DetailCell
                label="End"
                value={formatPortfolioDate(project.endDate) ?? "—"}
              />
              {isFounder ? (
                <DetailCell
                  label="Budget"
                  value={
                    project.budget !== null
                      ? formatMoney(project.budget, budgetCurrency)
                      : "—"
                  }
                />
              ) : (
                <DetailCell label="Task list" value={project.taskListName ?? "—"} />
              )}
              {isFounder && (
                <DetailCell
                  label="Spent"
                  value={
                    project.budgetSpent !== null
                      ? formatMoney(project.budgetSpent, budgetCurrency)
                      : "—"
                  }
                />
              )}
            </dl>
            {project.description ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/60">
                {project.description}
              </p>
            ) : (
              <p className="mt-3 text-xs text-white/30">No description yet.</p>
            )}
          </section>

          {/* Milestones */}
          <section className={SECTION_CLASS}>
            <SectionHeader
              title="Milestones"
              count={project.milestones.length}
              action={
                isFounder || isAssigned ? (
                  <button
                    type="button"
                    onClick={() => setMilestoneOpen(true)}
                    className={SMALL_GHOST_BUTTON_CLASS}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                ) : undefined
              }
            />
            {project.milestones.length === 0 ? (
              <p className="mt-3 text-xs text-white/30">
                No milestones yet.
                {isFounder || isAssigned
                  ? " Add the first one to track delivery."
                  : ""}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {project.milestones.map((milestone) => {
                  const completed = milestone.status === "completed";
                  const canToggle = isFounder || isAssigned;
                  return (
                    <li
                      key={milestone.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border bg-glass-04 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        {canToggle ? (
                          <button
                            type="button"
                            onClick={() => void handleToggleMilestone(milestone)}
                            aria-label={
                              completed
                                ? `Reopen ${milestone.title}`
                                : `Complete ${milestone.title}`
                            }
                            className="mt-0.5 text-white/30 transition-colors hover:text-emerald-400"
                          >
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                        ) : completed ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 text-white/30" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm ${
                              completed
                                ? "text-white/40 line-through"
                                : "text-white/80"
                            }`}
                          >
                            {milestone.title}
                          </p>
                          <p className="text-[10px] text-white/35">
                            {milestone.dueDate
                              ? `Due ${formatPortfolioDate(milestone.dueDate) ?? milestone.dueDate}`
                              : "No due date"}
                            {milestone.description
                              ? ` · ${milestone.description}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        {canToggle ? (
                          <select
                            aria-label={`Status for ${milestone.title}`}
                            value={milestone.status}
                            onChange={(event) =>
                              void handleMilestoneStatus(
                                milestone,
                                event.target.value as MilestoneStatus,
                              )
                            }
                            className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-[10px] outline-none transition-colors focus:ring-1 focus:ring-cyan-500/40 ${MILESTONE_STATUS_STYLES[milestone.status]}`}
                          >
                            {MILESTONE_STATUS_OPTIONS.map((status) => (
                              <option
                                key={status}
                                value={status}
                                className="bg-[#0a0a0a] text-white"
                              >
                                {MILESTONE_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${MILESTONE_STATUS_STYLES[milestone.status]}`}
                          >
                            {MILESTONE_STATUS_LABELS[milestone.status]}
                          </span>
                        )}
                        {isFounder && (
                          <button
                            type="button"
                            onClick={() => setDeleteMilestoneId(milestone.id)}
                            aria-label={`Delete ${milestone.title}`}
                            className="rounded p-1 text-white/20 transition-colors hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Linked task list */}
          <section className={SECTION_CLASS}>
            <SectionHeader
              title="Linked task list"
              action={
                project.taskListId ? (
                  <Link href="/tasks" className={SMALL_GHOST_BUTTON_CLASS}>
                    <ListChecks className="h-3.5 w-3.5" />
                    Open tasks
                  </Link>
                ) : undefined
              }
            />
            {project.taskListId ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-glass-04 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/80">
                    {project.taskListName ?? "Linked task list"}
                  </p>
                  <p className="text-[10px] text-white/35">
                    {project.taskCounts.open} open ·{" "}
                    {project.taskCounts.completed} completed
                  </p>
                </div>
                <Link2 className="h-4 w-4 flex-shrink-0 text-white/20" />
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/30">
                {isFounder
                  ? "No task list linked yet. Use Edit to link one of this workspace's lists."
                  : "No task list linked yet."}
              </p>
            )}
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          {/* Retainer */}
          <section className={SECTION_CLASS}>
            <SectionHeader
              title="Retainer"
              action={<Wallet className="h-4 w-4 text-white/20" />}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${RETAINER_STYLES[project.retainer.status]}`}
              >
                {retainerLabel(project.retainer.status)}
              </span>
              {project.retainer.monthlyAmount !== null && (
                <span className="font-mono text-sm text-white/70">
                  {formatMoney(
                    project.retainer.monthlyAmount,
                    project.retainer.currency,
                  )}
                  <span className="text-white/30">/mo</span>
                </span>
              )}
            </div>
            <dl className="mt-3 space-y-1.5 text-xs">
              <SideRow
                label="Started"
                value={formatPortfolioDate(project.retainer.startedOn) ?? "—"}
              />
              <SideRow
                label="Renews"
                value={formatPortfolioDate(project.retainer.renewsOn) ?? "—"}
              />
            </dl>
            {renewalHint && (
              <p className="mt-2 text-[11px] text-white/40">{renewalHint}</p>
            )}
            {!isFounder && (
              <p className="mt-2 text-[10px] text-white/25">
                Amounts are visible to founders only.
              </p>
            )}
          </section>

          {/* Team */}
          <section className={SECTION_CLASS}>
            <SectionHeader
              title="Team"
              count={project.members.length}
              action={
                isFounder ? (
                  <button
                    type="button"
                    onClick={() => setMemberOpen(true)}
                    className={SMALL_GHOST_BUTTON_CLASS}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add
                  </button>
                ) : undefined
              }
            />
            {project.members.length === 0 ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
                <Users className="h-3.5 w-3.5" />
                No one assigned yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {project.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center gap-2 rounded-lg border border-border bg-glass-04 px-2.5 py-1.5"
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-mono text-[10px] text-white/60">
                      {initialsFor(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/80">
                        {member.name}
                        {currentUserId === member.userId ? " (you)" : ""}
                      </p>
                      <span className="mt-0.5 inline-flex rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">
                        {MEMBER_ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    {isFounder && (
                      <button
                        type="button"
                        onClick={() => setRemoveMemberId(member.userId)}
                        aria-label={`Remove ${member.name}`}
                        className="rounded p-1 text-white/20 transition-colors hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Partners */}
          <section className={SECTION_CLASS}>
            <SectionHeader
              title="Partners"
              count={project.partners.length}
              action={
                isFounder ? (
                  <button
                    type="button"
                    onClick={() => setPartnerOpen(true)}
                    className={SMALL_GHOST_BUTTON_CLASS}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Link
                  </button>
                ) : undefined
              }
            />
            {project.partners.length === 0 ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
                <Handshake className="h-3.5 w-3.5" />
                No partners linked.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {project.partners.map((partner) => (
                  <li
                    key={partner.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-glass-04 px-2.5 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/80">
                        {partner.name}
                      </p>
                      <p className="text-[10px] text-white/35">
                        {PARTNER_KIND_LABELS[partner.kind]}
                        {partner.role ? ` · ${partner.role}` : ""}
                      </p>
                    </div>
                    {isFounder && (
                      <button
                        type="button"
                        onClick={() => setRemovePartnerId(partner.id)}
                        aria-label={`Unlink ${partner.name}`}
                        className="rounded p-1 text-white/20 transition-colors hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Dialogs */}
      {isFounder && (
        <MemberDialog
          open={memberOpen}
          onClose={() => setMemberOpen(false)}
          projectId={project.id}
          members={project.members}
          onAdded={refresh}
        />
      )}

      {isFounder && (
        <PartnerLinkDialog
          open={partnerOpen}
          onClose={() => setPartnerOpen(false)}
          projectId={project.id}
          partners={partners}
          linked={project.partners}
          onAdded={refresh}
        />
      )}

      {(isFounder || isAssigned) && (
        <MilestoneDialog
          open={milestoneOpen}
          onClose={() => setMilestoneOpen(false)}
          projectId={project.id}
          onAdded={refresh}
        />
      )}

      {isFounder && (
        <ProjectDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          project={project}
        />
      )}

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive project?"
        description={`"${project.title}" stays in the portfolio with an Archived badge; set its status back from Edit to restore it.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={removeMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveMemberId(null);
        }}
        title="Remove member?"
        description={
          removeMember
            ? `${removeMember.name} loses edit access to this project's progress and milestones.`
            : undefined
        }
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
      />

      <ConfirmDialog
        open={removePartnerId !== null}
        onOpenChange={(open) => {
          if (!open) setRemovePartnerId(null);
        }}
        title="Unlink partner?"
        description={
          removePartner
            ? `${removePartner.name} stays in the partner register; only this project link is removed.`
            : undefined
        }
        confirmLabel="Unlink"
        onConfirm={handleRemovePartner}
      />

      <ConfirmDialog
        open={deleteMilestoneId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteMilestoneId(null);
        }}
        title="Delete milestone?"
        description={
          deleteMilestone
            ? `"${deleteMilestone.title}" will be removed permanently.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteMilestone}
      />
    </div>
  );
}

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-white">
        {title}
        {count !== undefined && (
          <span className="ml-1.5 text-xs font-normal text-white/30">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-white/35">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-white/70" title={value}>
        {value}
      </dd>
    </div>
  );
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-white/35">{label}</dt>
      <dd className="truncate font-mono text-white/60">{value}</dd>
    </div>
  );
}
