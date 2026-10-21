"use client";

/**
 * MemberDialog
 * ------------
 * Founder-only "assign a member" form. Pulls the workspace roster through the
 * existing `getWorkspaceMembers` helper (the same one the task sheet uses) and
 * hides people who are already assigned.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { addProjectMember } from "@/app/actions/portfolio";
import { getWorkspaceMembers } from "@/app/actions/workspace";
import type { MemberRole, PortfolioMember } from "@/lib/portfolio";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PortfolioDialog } from "./portfolio-dialog";
import {
  FIELD_SELECT_CLASS,
  GHOST_BUTTON_CLASS,
  LABEL_CLASS,
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_OPTIONS,
  PRIMARY_BUTTON_CLASS,
} from "./portfolio-constants";

interface MemberOption {
  userId: string;
  label: string;
}

interface MemberDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: PortfolioMember[];
  onAdded: () => void;
}

export function MemberDialog({
  open,
  onClose,
  projectId,
  members,
  onAdded,
}: MemberDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [options, setOptions] = useState<MemberOption[] | null>(null);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<MemberRole>("developer");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUserId("");
    setRole("developer");
  }, [open]);

  useEffect(() => {
    if (!open || !activeWorkspaceId) return;
    let cancelled = false;
    setOptions(null);
    getWorkspaceMembers(activeWorkspaceId)
      .then((result) => {
        if (cancelled) return;
        setOptions(
          result.members.map((member) => ({
            userId: member.userId,
            label: member.name || member.email || "Unnamed member",
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
        toast.error("Failed to load workspace members");
      });
    return () => {
      cancelled = true;
    };
  }, [open, activeWorkspaceId]);

  const assigned = new Set(members.map((member) => member.userId));
  const available = (options ?? []).filter(
    (option) => !assigned.has(option.userId),
  );

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Pick a workspace member first");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addProjectMember(projectId, userId, role);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Member assigned");
      onAdded();
      onClose();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onClose={onClose}
      title="Assign a member"
      description="Assigned members can update progress and manage milestones."
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
            disabled={submitting || !userId}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting && <Loader className="h-4 w-4 animate-spin" />}
            {submitting ? "Assigning…" : "Assign member"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="member-user" className={LABEL_CLASS}>
            Workspace member
          </label>
          <select
            id="member-user"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className={FIELD_SELECT_CLASS}
          >
            <option value="">
              {options === null
                ? "Loading members…"
                : available.length === 0
                  ? "Everyone is already assigned"
                  : "Select a member…"}
            </option>
            {available.map((option) => (
              <option key={option.userId} value={option.userId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="member-role" className={LABEL_CLASS}>
            Project role
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(event) => setRole(event.target.value as MemberRole)}
            className={FIELD_SELECT_CLASS}
          >
            {MEMBER_ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {MEMBER_ROLE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {available.length === 0 && options !== null && (
          <p className="text-[11px] text-white/40">
            Every workspace member is already on this project.
          </p>
        )}
      </div>
    </PortfolioDialog>
  );
}
