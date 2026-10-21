"use client";

/**
 * PartnerDialog
 * -------------
 * Create or edit a partner in the register. Passing `partner` switches the
 * dialog into edit mode (`updatePartner`); omitting it creates a new row.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { createPartner, updatePartner } from "@/app/actions/portfolio";
import type { PartnerKind } from "@/lib/portfolio";
import { PortfolioDialog } from "./portfolio-dialog";
import {
  FIELD_CLASS,
  FIELD_SELECT_CLASS,
  GHOST_BUTTON_CLASS,
  LABEL_CLASS,
  PARTNER_KIND_LABELS,
  PARTNER_KIND_OPTIONS,
  PRIMARY_BUTTON_CLASS,
} from "./portfolio-constants";
import type { PartnerRecord } from "./partner-record";

interface PartnerDialogProps {
  open: boolean;
  onClose: () => void;
  /** null -> create mode */
  partner: PartnerRecord | null;
  onSaved: () => void;
}

interface PartnerFormState {
  name: string;
  kind: PartnerKind;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  status: "active" | "inactive";
}

const EMPTY_FORM: PartnerFormState = {
  name: "",
  kind: "agency",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  notes: "",
  status: "active",
};

export function PartnerDialog({
  open,
  onClose,
  partner,
  onSaved,
}: PartnerDialogProps) {
  const [form, setForm] = useState<PartnerFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      partner
        ? {
            name: partner.name,
            kind: partner.kind,
            contactName: partner.contactName ?? "",
            email: partner.email ?? "",
            phone: partner.phone ?? "",
            website: partner.website ?? "",
            notes: partner.notes ?? "",
            status: partner.status,
          }
        : EMPTY_FORM,
    );
  }, [open, partner]);

  const update = <K extends keyof PartnerFormState>(
    key: K,
    value: PartnerFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Partner name is required");
      return;
    }

    const payload = {
      name,
      kind: form.kind,
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      notes: form.notes.trim(),
      status: form.status,
    };

    setSubmitting(true);
    try {
      const result = partner
        ? await updatePartner(partner.id, payload)
        : await createPartner(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(partner ? "Partner updated" : "Partner added");
      onSaved();
      onClose();
    } catch {
      toast.error(partner ? "Failed to update partner" : "Failed to add partner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onClose={onClose}
      title={partner ? "Edit partner" : "New partner"}
      description="Partners can be linked to any project from either side."
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
            disabled={submitting || !form.name.trim()}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting && <Loader className="h-4 w-4 animate-spin" />}
            {submitting
              ? "Saving…"
              : partner
                ? "Save changes"
                : "Add partner"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="partner-name" className={LABEL_CLASS}>
            Name
          </label>
          <input
            id="partner-name"
            type="text"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. Zenlabs"
            maxLength={120}
            className={FIELD_CLASS}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="partner-kind" className={LABEL_CLASS}>
            Kind
          </label>
          <select
            id="partner-kind"
            value={form.kind}
            onChange={(event) =>
              update("kind", event.target.value as PartnerKind)
            }
            className={FIELD_SELECT_CLASS}
          >
            {PARTNER_KIND_OPTIONS.map((kind) => (
              <option key={kind} value={kind}>
                {PARTNER_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="partner-contact" className={LABEL_CLASS}>
            Contact name
          </label>
          <input
            id="partner-contact"
            type="text"
            value={form.contactName}
            onChange={(event) => update("contactName", event.target.value)}
            placeholder="Who do we talk to?"
            maxLength={120}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="partner-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="partner-email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="name@example.com"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="partner-phone" className={LABEL_CLASS}>
            Phone
          </label>
          <input
            id="partner-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+63…"
            maxLength={40}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="partner-website" className={LABEL_CLASS}>
            Website
          </label>
          <input
            id="partner-website"
            type="url"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
            placeholder="https://…"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="partner-status" className={LABEL_CLASS}>
            Status
          </label>
          <select
            id="partner-status"
            value={form.status}
            onChange={(event) =>
              update("status", event.target.value as "active" | "inactive")
            }
            className={FIELD_SELECT_CLASS}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="partner-notes" className={LABEL_CLASS}>
            Notes
          </label>
          <textarea
            id="partner-notes"
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            rows={3}
            placeholder="Deal terms, contacts, context…"
            className={FIELD_CLASS}
          />
        </div>
      </div>
    </PortfolioDialog>
  );
}
