"use client";

/**
 * ProjectDialog (create + edit)
 * -----------------------------
 * Founder-only project form. With no `project` it calls
 * `createPortfolioProject`; with one it prefills every field and calls
 * `updatePortfolioProject(id, input)`.
 *
 * Two fields are resolved behind the scenes:
 *   - `clientName` — free text; the server reuses an existing `clients` row
 *     (case-insensitive) or creates one, then writes `projects.client_id`.
 *   - `taskListId` — a real `pm_projects` list loaded from the active
 *     workspace, so progress/milestones can show open-task counts.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { createPortfolioProject, updatePortfolioProject } from "@/app/actions/portfolio";
import { getProjects } from "@/app/actions/projects";
import type { PortfolioKind, PortfolioStatus, RetainerStatus, PortfolioProjectSummary } from "@/lib/portfolio";
import type { Project } from "@/lib/schemas";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PortfolioDialog } from "./portfolio-dialog";
import {
  FIELD_CLASS,
  FIELD_SELECT_CLASS,
  GHOST_BUTTON_CLASS,
  KIND_LABELS,
  KIND_OPTIONS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  RETAINER_LABELS,
  RETAINER_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "./portfolio-constants";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  /** When present the dialog edits this project instead of creating one. */
  project?: PortfolioProjectSummary | null;
}

interface ProjectFormState {
  title: string;
  kind: PortfolioKind;
  portfolioStatus: PortfolioStatus;
  description: string;
  category: string;
  clientName: string;
  taskListId: string;
  startDate: string;
  endDate: string;
  budget: string;
  progress: string;
  retainerStatus: RetainerStatus;
  retainerMonthlyAmount: string;
  retainerCurrency: string;
  retainerStartedOn: string;
  retainerRenewsOn: string;
  publishedSiteUrl: string;
}

const EMPTY_FORM: ProjectFormState = {
  title: "",
  kind: "venture",
  portfolioStatus: "planning",
  description: "",
  category: "",
  clientName: "",
  taskListId: "",
  startDate: "",
  endDate: "",
  budget: "",
  progress: "",
  retainerStatus: "none",
  retainerMonthlyAmount: "",
  retainerCurrency: "PHP",
  retainerStartedOn: "",
  retainerRenewsOn: "",
  publishedSiteUrl: "",
};

/** `null`/`undefined` -> ""; `12.5` -> "12.5" (never "12.50"). */
function numberToField(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/** Date columns come back as `YYYY-MM-DD`; trim any timestamp tail. */
function dateToField(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function formFromProject(project: PortfolioProjectSummary): ProjectFormState {
  return {
    title: project.title,
    kind: project.kind,
    portfolioStatus: project.portfolioStatus,
    description: project.description ?? "",
    category: project.category ?? "",
    clientName: project.client?.name ?? "",
    taskListId: project.taskListId ?? "",
    startDate: dateToField(project.startDate),
    endDate: dateToField(project.endDate),
    budget: numberToField(project.budget),
    progress: numberToField(project.progress),
    retainerStatus: project.retainer.status,
    retainerMonthlyAmount: numberToField(project.retainer.monthlyAmount),
    retainerCurrency: project.retainer.currency || "PHP",
    retainerStartedOn: dateToField(project.retainer.startedOn),
    retainerRenewsOn: dateToField(project.retainer.renewsOn),
    publishedSiteUrl: project.publishedSiteUrl ?? "",
  };
}

/** Empty -> null; throws a message-friendly failure for non-positive input. */
function parseOptionalNumber(
  value: string,
  label: string,
): { value: number | null; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: `${label} must be a positive number` };
  }
  return { value: parsed };
}

export function ProjectDialog({ open, onClose, project }: ProjectDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [taskLists, setTaskLists] = useState<Project[]>([]);
  const [taskListsLoading, setTaskListsLoading] = useState(false);

  // Re-seed the form every time the dialog opens (create vs edit target).
  useEffect(() => {
    if (!open) return;
    setForm(project ? formFromProject(project) : EMPTY_FORM);
  }, [open, project]);

  // Task lists come from the active workspace, fetched through the same
  // action the Operations views use (`pm_projects`, active lists only).
  useEffect(() => {
    if (!open || !activeWorkspaceId) return;
    let cancelled = false;
    setTaskListsLoading(true);
    getProjects(activeWorkspaceId)
      .then((lists) => {
        if (!cancelled) setTaskLists(lists);
      })
      .catch(() => {
        if (!cancelled) setTaskLists([]);
      })
      .finally(() => {
        if (!cancelled) setTaskListsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, activeWorkspaceId]);

  const update = <K extends keyof ProjectFormState>(
    key: K,
    value: ProjectFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(project ? formFromProject(project) : EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    const budget = parseOptionalNumber(form.budget, "Budget");
    if (budget.error) {
      toast.error(budget.error);
      return;
    }

    const monthly = parseOptionalNumber(
      form.retainerMonthlyAmount,
      "Monthly retainer",
    );
    if (monthly.error) {
      toast.error(monthly.error);
      return;
    }

    let progress: number | null = null;
    const rawProgress = form.progress.trim();
    if (rawProgress) {
      const parsed = Number(rawProgress);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
        toast.error("Progress must be a whole number from 0 to 100");
        return;
      }
      progress = parsed;
    }

    const input = {
      title,
      kind: form.kind,
      portfolioStatus: form.portfolioStatus,
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      // Empty means "leave the client alone"; clearing is not a supported
      // operation on this field (same as before Phase 3).
      clientName: form.clientName.trim() || undefined,
      taskListId: form.taskListId || null,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      budget: budget.value,
      progress,
      retainerStatus: form.retainerStatus,
      retainerMonthlyAmount: monthly.value,
      retainerCurrency: form.retainerCurrency.trim().toUpperCase() || "PHP",
      retainerStartedOn: form.retainerStartedOn || undefined,
      retainerRenewsOn: form.retainerRenewsOn || undefined,
      publishedSiteUrl: form.publishedSiteUrl.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const result = project
        ? await updatePortfolioProject(project.id, input)
        : await createPortfolioProject(input);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        project ? `Project "${title}" updated` : `Project "${title}" created`,
      );
      setForm(project ? formFromProject(project) : EMPTY_FORM);
      onClose();
      router.refresh();
    } catch {
      toast.error(
        project ? "Failed to update project" : "Failed to create project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit project" : "New project"}
      description={
        isEdit
          ? "Update the portfolio record. Amounts and the client stay founder-only."
          : "Add a venture, client engagement or internal build to the portfolio."
      }
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className={GHOST_BUTTON_CLASS}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !form.title.trim()}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting && <Loader className="h-4 w-4 animate-spin" />}
            {submitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create project"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="pf-title" className={LABEL_CLASS}>
            Title
          </label>
          <input
            id="pf-title"
            type="text"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="e.g. Golf Management System"
            className={FIELD_CLASS}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="pf-kind" className={LABEL_CLASS}>
            Kind
          </label>
          <select
            id="pf-kind"
            value={form.kind}
            onChange={(event) =>
              update("kind", event.target.value as PortfolioKind)
            }
            className={FIELD_SELECT_CLASS}
          >
            {KIND_OPTIONS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pf-status" className={LABEL_CLASS}>
            Portfolio status
          </label>
          <select
            id="pf-status"
            value={form.portfolioStatus}
            onChange={(event) =>
              update("portfolioStatus", event.target.value as PortfolioStatus)
            }
            className={FIELD_SELECT_CLASS}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pf-description" className={LABEL_CLASS}>
            Description
          </label>
          <textarea
            id="pf-description"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={3}
            placeholder="What is this project, in one or two sentences?"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="pf-category" className={LABEL_CLASS}>
            Category
          </label>
          <input
            id="pf-category"
            type="text"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
            placeholder="e.g. Agritech"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="pf-client-name" className={LABEL_CLASS}>
            Client name
          </label>
          <input
            id="pf-client-name"
            type="text"
            value={form.clientName}
            onChange={(event) => update("clientName", event.target.value)}
            placeholder="e.g. MDM Events Management"
            maxLength={120}
            className={FIELD_CLASS}
          />
          <p className="mt-1 text-[10px] text-white/30">
            Matched case-insensitively; a new client is created when the name is
            unknown.
          </p>
        </div>

        <div>
          <label htmlFor="pf-start" className={LABEL_CLASS}>
            Start date
          </label>
          <input
            id="pf-start"
            type="date"
            value={form.startDate}
            onChange={(event) => update("startDate", event.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="pf-end" className={LABEL_CLASS}>
            End date
          </label>
          <input
            id="pf-end"
            type="date"
            value={form.endDate}
            onChange={(event) => update("endDate", event.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="pf-progress" className={LABEL_CLASS}>
            Progress (%)
          </label>
          <input
            id="pf-progress"
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.progress}
            onChange={(event) => update("progress", event.target.value)}
            placeholder="0"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="pf-budget" className={LABEL_CLASS}>
            Budget
          </label>
          <input
            id="pf-budget"
            type="number"
            min={0}
            step="0.01"
            value={form.budget}
            onChange={(event) => update("budget", event.target.value)}
            placeholder="0"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="pf-task-list" className={LABEL_CLASS}>
            Linked task list
          </label>
          <select
            id="pf-task-list"
            value={form.taskListId}
            onChange={(event) => update("taskListId", event.target.value)}
            className={FIELD_SELECT_CLASS}
            disabled={taskListsLoading}
          >
            <option value="">
              {taskListsLoading ? "Loading lists…" : "No task list"}
            </option>
            {form.taskListId &&
              !taskLists.some((list) => list.id === form.taskListId) && (
                <option value={form.taskListId}>
                  {project?.taskListName ?? "Current list (not in this workspace)"}
                </option>
              )}
            {taskLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pf-published-url" className={LABEL_CLASS}>
            Live URL
          </label>
          <input
            id="pf-published-url"
            type="url"
            value={form.publishedSiteUrl}
            onChange={(event) => update("publishedSiteUrl", event.target.value)}
            placeholder="https://…"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-glass-04 p-3">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/40">
          Retainer
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-retainer-status" className={LABEL_CLASS}>
              Status
            </label>
            <select
              id="pf-retainer-status"
              value={form.retainerStatus}
              onChange={(event) =>
                update("retainerStatus", event.target.value as RetainerStatus)
              }
              className={FIELD_SELECT_CLASS}
            >
              {RETAINER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {RETAINER_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pf-retainer-amount" className={LABEL_CLASS}>
              Monthly amount
            </label>
            <input
              id="pf-retainer-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.retainerMonthlyAmount}
              onChange={(event) =>
                update("retainerMonthlyAmount", event.target.value)
              }
              placeholder="0"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor="pf-retainer-currency" className={LABEL_CLASS}>
              Currency
            </label>
            <input
              id="pf-retainer-currency"
              type="text"
              value={form.retainerCurrency}
              onChange={(event) =>
                update("retainerCurrency", event.target.value)
              }
              placeholder="PHP"
              maxLength={8}
              className={FIELD_CLASS}
            />
          </div>

          <div />

          <div>
            <label htmlFor="pf-retainer-start" className={LABEL_CLASS}>
              Started on
            </label>
            <input
              id="pf-retainer-start"
              type="date"
              value={form.retainerStartedOn}
              onChange={(event) =>
                update("retainerStartedOn", event.target.value)
              }
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor="pf-retainer-renews" className={LABEL_CLASS}>
              Renews on
            </label>
            <input
              id="pf-retainer-renews"
              type="date"
              value={form.retainerRenewsOn}
              onChange={(event) =>
                update("retainerRenewsOn", event.target.value)
              }
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-white/30">
        Partners and assignees are linked from the project detail after saving.
      </p>
    </PortfolioDialog>
  );
}
