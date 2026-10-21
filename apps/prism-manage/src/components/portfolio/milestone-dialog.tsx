"use client";

/**
 * MilestoneDialog
 * ---------------
 * Add a milestone to a project. `createProjectMilestone` requires a due date,
 * so the field is marked required here too.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { createProjectMilestone } from "@/app/actions/portfolio";
import { PortfolioDialog } from "./portfolio-dialog";
import {
  FIELD_CLASS,
  GHOST_BUTTON_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "./portfolio-constants";

interface MilestoneDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onAdded: () => void;
}

export function MilestoneDialog({
  open,
  onClose,
  projectId,
  onAdded,
}: MilestoneDialogProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDueDate("");
    setDescription("");
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Milestone title is required");
      return;
    }
    if (!dueDate) {
      toast.error("Milestone due date is required");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createProjectMilestone(projectId, {
        title: title.trim(),
        dueDate,
        description: description.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Milestone added");
      onAdded();
      onClose();
    } catch {
      toast.error("Failed to add milestone");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onClose={onClose}
      title="New milestone"
      description="Milestones show up on the project detail and count toward delivery."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={GHOST_BUTTON_CLASS}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !title.trim() || !dueDate}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting && <Loader className="h-4 w-4 animate-spin" />}
            {submitting ? "Adding…" : "Add milestone"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="milestone-title" className={LABEL_CLASS}>
            Title
          </label>
          <input
            id="milestone-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Beta handoff"
            maxLength={200}
            className={FIELD_CLASS}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="milestone-due" className={LABEL_CLASS}>
            Due date
          </label>
          <input
            id="milestone-due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="milestone-description" className={LABEL_CLASS}>
            Notes
          </label>
          <textarea
            id="milestone-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Optional context for this milestone"
            className={FIELD_CLASS}
          />
        </div>
      </div>
    </PortfolioDialog>
  );
}
