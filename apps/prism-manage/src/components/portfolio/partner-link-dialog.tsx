"use client";

/**
 * PartnerLinkDialog
 * -----------------
 * Founder-only "link a partner" form for a project. The partner register is
 * passed in by the detail page so the list is already sorted and typed; only
 * unlinked partners are offered.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { addProjectPartner } from "@/app/actions/portfolio";
import type { PortfolioPartnerLink, PortfolioPartnerSummary } from "@/lib/portfolio";
import { PortfolioDialog } from "./portfolio-dialog";
import {
  FIELD_CLASS,
  FIELD_SELECT_CLASS,
  GHOST_BUTTON_CLASS,
  LABEL_CLASS,
  PARTNER_KIND_LABELS,
  PRIMARY_BUTTON_CLASS,
} from "./portfolio-constants";

interface PartnerLinkDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  partners: PortfolioPartnerSummary[];
  linked: PortfolioPartnerLink[];
  onAdded: () => void;
}

export function PartnerLinkDialog({
  open,
  onClose,
  projectId,
  partners,
  linked,
  onAdded,
}: PartnerLinkDialogProps) {
  const [partnerId, setPartnerId] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPartnerId("");
    setRole("");
  }, [open]);

  const linkedIds = new Set(linked.map((partner) => partner.id));
  const available = partners.filter((partner) => !linkedIds.has(partner.id));

  const handleSubmit = async () => {
    if (!partnerId) {
      toast.error("Pick a partner first");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addProjectPartner(
        projectId,
        partnerId,
        role.trim() || undefined,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Partner linked");
      onAdded();
      onClose();
    } catch {
      toast.error("Failed to link partner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onClose={onClose}
      title="Link a partner"
      description="Partners are managed in the partners register."
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
            disabled={submitting || !partnerId}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting && <Loader className="h-4 w-4 animate-spin" />}
            {submitting ? "Linking…" : "Link partner"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="link-partner" className={LABEL_CLASS}>
            Partner
          </label>
          <select
            id="link-partner"
            value={partnerId}
            onChange={(event) => setPartnerId(event.target.value)}
            className={FIELD_SELECT_CLASS}
          >
            <option value="">
              {available.length === 0
                ? "Every partner is already linked"
                : "Select a partner…"}
            </option>
            {available.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name} · {PARTNER_KIND_LABELS[partner.kind]}
                {partner.status === "inactive" ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="link-partner-role" className={LABEL_CLASS}>
            Role on this project
          </label>
          <input
            id="link-partner-role"
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="e.g. co-development"
            maxLength={120}
            className={FIELD_CLASS}
          />
        </div>
      </div>
    </PortfolioDialog>
  );
}
