/**
 * Partner register types
 * ----------------------
 * The portfolio action layer only returns `{ id, name, kind, status }` for
 * partners, which is all the project views need. The partners screen edits the
 * full register (contacts, website, notes), so it reads the `partners` table
 * directly through RLS (`Signed-in users can view partners`) and maps rows here.
 * Pure — no Supabase or React imports.
 */

import { normalizePartnerKind, type PartnerKind } from "@/lib/portfolio";

export interface PartnerRecord {
  id: string;
  name: string;
  kind: PartnerKind;
  status: "active" | "inactive";
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > 0 ? text : null;
}

export function mapPartnerRecord(row: Record<string, unknown>): PartnerRecord {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    kind: normalizePartnerKind(row.kind),
    status: row.status === "inactive" ? "inactive" : "active",
    contactName: toStringOrNull(row.contact_name),
    email: toStringOrNull(row.email),
    phone: toStringOrNull(row.phone),
    website: toStringOrNull(row.website),
    notes: toStringOrNull(row.notes),
  };
}
