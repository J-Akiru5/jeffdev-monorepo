"use client";

/**
 * PartnersView (/portfolio/partners)
 * ----------------------------------
 * The partner register: kind, status, contact details, website, notes and how
 * many portfolio projects each partner is linked to. Founders can create, edit
 * and delete; everyone else reads.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Handshake,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ConfirmDialog, EmptyState } from "@syntaxure/ui";
import { deletePartner } from "@/app/actions/portfolio";
import type { PortfolioProjectSummary } from "@/lib/portfolio";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PartnerDialog } from "./partner-dialog";
import { PortfolioTabs } from "./portfolio-tabs";
import {
  externalHref,
  PARTNER_KIND_LABELS,
  PARTNER_STATUS_STYLES,
  PRIMARY_BUTTON_CLASS,
  SECTION_CLASS,
  SMALL_GHOST_BUTTON_CLASS,
} from "./portfolio-constants";
import type { PartnerRecord } from "./partner-record";

interface PartnersViewProps {
  partners: PartnerRecord[];
  projects: PortfolioProjectSummary[];
}

function websiteLabel(url: string): string {
  try {
    return new URL(externalHref(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PartnersView({ partners, projects }: PartnersViewProps) {
  const router = useRouter();
  const userRole = useWorkspaceStore((state) => state.userRole);
  const isFounder = userRole === "founder";

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerRecord | null>(null);
  const [deleting, setDeleting] = useState<PartnerRecord | null>(null);

  const projectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const partner of project.partners) {
        counts.set(partner.id, (counts.get(partner.id) ?? 0) + 1);
      }
    }
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((partner) =>
      [
        partner.name,
        partner.contactName ?? "",
        partner.email ?? "",
        partner.website ?? "",
        PARTNER_KIND_LABELS[partner.kind],
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [partners, search]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (partner: PartnerRecord) => {
    setEditing(partner);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const result = await deletePartner(deleting.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Partner "${deleting.name}" deleted`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Partners</h1>
          <p className="mt-1 text-sm text-white/40">
            Agencies, products, venues and infrastructure partners across the
            portfolio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PortfolioTabs />
          {isFounder && (
            <button
              type="button"
              onClick={openCreate}
              className={PRIMARY_BUTTON_CLASS}
            >
              <Plus className="h-4 w-4" />
              New partner
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search partners, contacts, emails…"
            className="h-9 w-full rounded-lg border border-border bg-glass-04 pl-9 pr-3 text-sm text-white/70 outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50"
          />
        </div>
        <span className="text-[11px] text-white/30">
          {filtered.length} of {partners.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className={SECTION_CLASS}>
          <EmptyState
            icon={<Handshake className="h-6 w-6 text-white/20" />}
            title={partners.length === 0 ? "No partners yet" : "No matching partners"}
            description={
              partners.length === 0
                ? isFounder
                  ? "Add the agencies, venues and vendors you build with, then link them to projects."
                  : "Once a founder adds a partner it will appear here."
                : "Nothing matches that search. Try a different name or contact."
            }
            action={
              isFounder && partners.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  <Plus className="h-4 w-4" />
                  New partner
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* Table (md+) */}
          <div className="hidden overflow-x-auto rounded-xl border border-border glass-subtle md:block">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-white/35">
                  <th className="px-4 py-2 font-medium">Partner</th>
                  <th className="px-3 py-2 font-medium">Kind</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Projects</th>
                  <th className="px-4 py-2 text-right font-medium">
                    {isFounder ? "Actions" : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((partner) => (
                  <tr
                    key={partner.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-sm text-white/80">{partner.name}</p>
                      {partner.website && (
                        <a
                          href={externalHref(partner.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400/70 transition-colors hover:text-cyan-300"
                        >
                          {websiteLabel(partner.website)}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-white/50">
                      {PARTNER_KIND_LABELS[partner.kind]}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${PARTNER_STATUS_STYLES[partner.status]}`}
                      >
                        {partner.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {partner.contactName || partner.email ? (
                        <div className="min-w-0">
                          {partner.contactName && (
                            <p className="truncate text-white/70">
                              {partner.contactName}
                            </p>
                          )}
                          {partner.email && (
                            <a
                              href={`mailto:${partner.email}`}
                              className="block truncate text-[10px] text-white/35 hover:text-white/60"
                            >
                              {partner.email}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-white/50">
                      {projectCounts.get(partner.id) ?? 0}
                    </td>
                    <td className="px-4 py-2.5">
                      {isFounder && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(partner)}
                            aria-label={`Edit ${partner.name}`}
                            className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(partner)}
                            aria-label={`Delete ${partner.name}`}
                            className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="space-y-2 md:hidden">
            {filtered.map((partner) => (
              <article
                key={partner.id}
                className="rounded-xl border border-border glass-subtle p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/80">
                      {partner.name}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {PARTNER_KIND_LABELS[partner.kind]} ·{" "}
                      {projectCounts.get(partner.id) ?? 0} project
                      {(projectCounts.get(partner.id) ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] ${PARTNER_STATUS_STYLES[partner.status]}`}
                  >
                    {partner.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                {(partner.contactName || partner.email) && (
                  <p className="mt-2 truncate text-[11px] text-white/45">
                    {[partner.contactName, partner.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                {partner.website && (
                  <a
                    href={externalHref(partner.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-cyan-400/70"
                  >
                    {websiteLabel(partner.website)}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}

                {partner.notes && (
                  <p className="mt-2 line-clamp-2 text-[11px] text-white/30">
                    {partner.notes}
                  </p>
                )}

                {isFounder && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(partner)}
                      className={SMALL_GHOST_BUTTON_CLASS}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(partner)}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-xs text-rose-400/80 transition-colors hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {isFounder && (
        <PartnerDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          partner={editing}
          onSaved={() => router.refresh()}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete partner?"
        description={
          deleting
            ? `"${deleting.name}" will be removed from the register and unlinked from every project. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
