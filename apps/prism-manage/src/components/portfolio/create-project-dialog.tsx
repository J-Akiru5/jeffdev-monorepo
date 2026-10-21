"use client";

/**
 * CreateProjectDialog
 * -------------------
 * Founder-only "New project" form. Posts one `createPortfolioProject` call and
 * keeps every optional field optional — v1 has no client picker, so the project
 * is created as an own venture/client without a `clients` row (see the report).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { createPortfolioProject } from "@/app/actions/portfolio";
import type {
  PortfolioKind,
  PortfolioStatus,
  RetainerStatus,
} from "@/lib/portfolio";
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

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CreateFormState {
  title: string;
  kind: PortfolioKind;
  portfolioStatus: PortfolioStatus;
  description: string;
  category: string;
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

const EMPTY_FORM: CreateFormState = {
  title: "",
  kind: "venture",
  portfolioStatus: "planning",
  description: "",
  category: "",
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

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof CreateFormState>(
    key: K,
    value: CreateFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(EMPTY_FORM);
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

    setSubmitting(true);
    try {
      const result = await createPortfolioProject({
        title,
        kind: form.kind,
        portfolioStatus: form.portfolioStatus,
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
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
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Project "${title}" created`);
      setForm(EMPTY_FORM);
      onClose();
      router.refresh();
    } catch {
      toast.error("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onClose={handleClose}
      title="New project"
      description="Add a venture, client engagement or internal build to the portfolio."
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
            {submitting ? "Creating…" : "Create project"}
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
        Clients, partners and assignees are linked from the project detail after
        creation.
      </p>
    </PortfolioDialog>
  );
}
