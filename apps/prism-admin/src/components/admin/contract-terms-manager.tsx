"use client";

/**
 * Contract Terms Manager
 *
 * Manages contract terms (3-year, 5-year) for a product template.
 * Includes pricing, includes checklist, and extension settings.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Check,
} from "lucide-react";
import {
  getContractTerms,
  createContractTerm,
  updateContractTerm,
  deleteContractTerm,
  type ContractTermInput,
} from "@/app/actions/products";

// =============================================================================
// TYPES
// =============================================================================

interface ContractTerm {
  id: string;
  template_id: string;
  term_months: number;
  billing_cycle: "monthly" | "annual";
  price_php: number;
  price_usd: number;
  discount_percent: number;
  includes: Record<string, unknown>;
  extension_enabled: boolean;
  extension_max_years: number;
  extension_rate_increase_percent: number;
  highlighted: boolean;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface ContractTermsManagerProps {
  templateId: string;
  templateName: string;
}

// =============================================================================
// INCLUDES CHECKLIST CONFIG
// =============================================================================

const includesFields = [
  { key: "onboarding", label: "Onboarding Session" },
  { key: "deployment", label: "Deployment Setup" },
  { key: "training_session", label: "Training Session" },
  { key: "updates", label: "Software Updates" },
  { key: "hosting", label: "Managed Hosting" },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContractTermsManager({
  templateId,
  templateName,
}: ContractTermsManagerProps) {
  const [terms, setTerms] = useState<ContractTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Partial<ContractTerm> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    const result = await getContractTerms(templateId);
    if (result.success && result.data) {
      setTerms(result.data as ContractTerm[]);
    }
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const handleSave = async () => {
    if (!editingTerm) return;
    setSaving(true);

    const input: ContractTermInput = {
      template_id: templateId,
      term_months: editingTerm.term_months || 36,
      billing_cycle: editingTerm.billing_cycle || "monthly",
      price_php: editingTerm.price_php || 0,
      price_usd: editingTerm.price_usd || 0,
      discount_percent: editingTerm.discount_percent || 0,
      includes: editingTerm.includes || {},
      extension_enabled: editingTerm.extension_enabled ?? true,
      extension_max_years: editingTerm.extension_max_years || 5,
      extension_rate_increase_percent: editingTerm.extension_rate_increase_percent || 10,
      highlighted: editingTerm.highlighted ?? false,
      sort_order: editingTerm.sort_order || 0,
      status: editingTerm.status || "active",
    };

    let result;
    if (editingTerm.id) {
      result = await updateContractTerm(editingTerm.id, input);
    } else {
      result = await createContractTerm(input);
    }

    if (result.success) {
      fetchTerms();
      setModalOpen(false);
      setEditingTerm(null);
    } else {
      alert(result.error || "Failed to save");
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteContractTerm(id);
    if (result.success) {
      setTerms((prev) => prev.filter((t) => t.id !== id));
    }
    setConfirmDelete(null);
  };

  const toggleInclude = (key: string) => {
    if (!editingTerm) return;
    const includes = { ...(editingTerm.includes || {}) };
    includes[key] = !includes[key];
    setEditingTerm({ ...editingTerm, includes });
  };

  const formatTerm = (months: number) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0
        ? `${years}yr ${remainingMonths}mo`
        : `${years}yr`;
    }
    return `${months}mo`;
  };

  const formatPrice = (php: number, usd: number) => {
    return `₱${php.toLocaleString()} / $${usd.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white/80">Contract Terms</h3>
          <p className="text-xs text-white/40">
            Manage pricing and terms for {templateName}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTerm({
              template_id: templateId,
              term_months: 36,
              billing_cycle: "monthly",
              price_php: 0,
              price_usd: 0,
              discount_percent: 0,
              includes: {
                onboarding: true,
                deployment: true,
                training_session: true,
                updates: true,
                hosting: false,
              },
              extension_enabled: true,
              extension_max_years: 5,
              extension_rate_increase_percent: 10,
              highlighted: false,
              sort_order: terms.length,
              status: "active",
            });
            setModalOpen(true);
          }}
          className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Term
        </button>
      </div>

      {/* Terms List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-white/40 text-sm">Loading terms...</p>
        </div>
      ) : terms.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-white/5 rounded-lg">
          <Calendar className="h-6 w-6 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40">No contract terms found</p>
          <button
            onClick={() => {
              setEditingTerm({
                template_id: templateId,
                term_months: 36,
                billing_cycle: "monthly",
                price_php: 0,
                price_usd: 0,
                discount_percent: 0,
                includes: {
                  onboarding: true,
                  deployment: true,
                  training_session: true,
                  updates: true,
                  hosting: false,
                },
                extension_enabled: true,
                extension_max_years: 5,
                extension_rate_increase_percent: 10,
                highlighted: false,
                sort_order: 0,
                status: "active",
              });
              setModalOpen(true);
            }}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300"
          >
            Add your first term
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {terms.map((term) => (
            <div
              key={term.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <div className="p-3 flex items-center gap-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 opacity-30 hover:opacity-100">
                  <button
                    onClick={() => {
                      const index = terms.indexOf(term);
                      if (index > 0) {
                        // Swap with previous
                        const prev = terms[index - 1];
                        updateContractTerm(term.id, { sort_order: prev!.sort_order });
                        updateContractTerm(prev!.id, { sort_order: term.sort_order });
                        fetchTerms();
                      }
                    }}
                    disabled={terms.indexOf(term) === 0}
                    className="disabled:opacity-20"
                  >
                    <ChevronUp className="h-3 w-3 text-white/60" />
                  </button>
                  <button
                    onClick={() => {
                      const index = terms.indexOf(term);
                      if (index < terms.length - 1) {
                        // Swap with next
                        const next = terms[index + 1];
                        updateContractTerm(term.id, { sort_order: next!.sort_order });
                        updateContractTerm(next!.id, { sort_order: term.sort_order });
                        fetchTerms();
                      }
                    }}
                    disabled={terms.indexOf(term) === terms.length - 1}
                    className="disabled:opacity-20"
                  >
                    <ChevronDown className="h-3 w-3 text-white/60" />
                  </button>
                </div>

                {/* Term Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {formatTerm(term.term_months)}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        term.billing_cycle === "monthly"
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-violet-400 bg-violet-500/10"
                      }`}
                    >
                      {term.billing_cycle}
                    </span>
                    {term.highlighted && (
                      <span className="text-[10px] font-mono text-amber-400">
                        POPULAR
                      </span>
                    )}
                    {term.discount_percent > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        {term.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatPrice(term.price_php, term.price_usd)}/mo
                  </p>
                </div>

                {/* Extension Info */}
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-white/30">
                    Extends to {term.extension_max_years}yr (+{term.extension_rate_increase_percent}%)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setExpandedTerm(expandedTerm === term.id ? null : term.id);
                    }}
                    className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedTerm === term.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTerm(term);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(term.id)}
                    className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTerm === term.id && (
                <div className="px-3 pb-3 pt-0 border-t border-white/5">
                  <div className="mt-2 grid gap-2 text-xs text-white/60">
                    <div>
                      <span className="text-white/30">Includes:</span>{" "}
                      {Object.entries(term.includes || {})
                        .filter(([, v]) => v === true)
                        .map(([k]) => k.replace(/_/g, " "))
                        .join(", ")}
                    </div>
                    <div>
                      <span className="text-white/30">Extension:</span>{" "}
                      {term.extension_enabled
                        ? `Up to ${term.extension_max_years} years, +${term.extension_rate_increase_percent}% after 2 years`
                        : "Not available"}
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation */}
              {confirmDelete === term.id && (
                <div className="px-3 pb-3 flex items-center gap-3">
                  <span className="text-xs text-red-400">
                    Delete this term?
                  </span>
                  <button
                    onClick={() => handleDelete(term.id)}
                    className="px-2 py-1 text-[10px] font-medium bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 text-[10px] font-medium text-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL — Term Editor */}
      {/* ================================================================ */}
      {modalOpen && editingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#050505] p-6">
            <h2 className="text-lg font-semibold text-white mb-6">
              {editingTerm.id ? "Edit Contract Term" : "New Contract Term"}
            </h2>

            <div className="space-y-4">
              {/* Term Length + Billing Cycle */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Term Length">
                  <select
                    value={editingTerm.term_months || 36}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        term_months: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value={12}>1 Year (12 months)</option>
                    <option value={24}>2 Years (24 months)</option>
                    <option value={36}>3 Years (36 months)</option>
                    <option value={60}>5 Years (60 months)</option>
                  </select>
                </Field>

                <Field label="Billing Cycle">
                  <select
                    value={editingTerm.billing_cycle || "monthly"}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        billing_cycle: e.target.value as "monthly" | "annual",
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </Field>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (PHP)">
                  <input
                    type="number"
                    value={editingTerm.price_php || ""}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        price_php: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="2500"
                  />
                </Field>

                <Field label="Price (USD)">
                  <input
                    type="number"
                    value={editingTerm.price_usd || ""}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        price_usd: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="45"
                  />
                </Field>
              </div>

              <Field label="Annual Discount (%)">
                <input
                  type="number"
                  value={editingTerm.discount_percent || ""}
                  onChange={(e) =>
                    setEditingTerm({
                      ...editingTerm,
                      discount_percent: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="10"
                />
              </Field>

              {/* Includes Checklist */}
              <div>
                <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                  What&apos;s Included
                </label>
                <div className="space-y-2">
                  {includesFields.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        onClick={() => toggleInclude(field.key)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          (editingTerm.includes || {})[field.key]
                            ? "bg-amber-500 border-amber-500"
                            : "border-white/20 bg-white/[0.02]"
                        }`}
                      >
                        {!!(editingTerm.includes || {})[field.key] && (
                          <Check className="h-3 w-3 text-black" />
                        )}
                      </div>
                      <span className="text-sm text-white">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Support Months */}
              <Field label="Support Duration (months)">
                <input
                  type="number"
                  value={(editingTerm.includes as Record<string, unknown>)?.support_months as number || ""}
                  onChange={(e) =>
                    setEditingTerm({
                      ...editingTerm,
                      includes: {
                        ...(editingTerm.includes || {}),
                        support_months: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="36"
                />
              </Field>

              {/* Extension Settings */}
              <div className="border-t border-white/5 pt-4">
                <h3 className="text-sm font-medium text-white/80 mb-3">
                  Extension Settings
                </h3>

                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={editingTerm.extension_enabled ?? true}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        extension_enabled: e.target.checked,
                      })
                    }
                    className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-white">Enable Extension</span>
                </label>

                {editingTerm.extension_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Max Extension (years)">
                      <input
                        type="number"
                        value={editingTerm.extension_max_years || 5}
                        onChange={(e) =>
                          setEditingTerm({
                            ...editingTerm,
                            extension_max_years: Number(e.target.value),
                          })
                        }
                        className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                      />
                    </Field>

                    <Field label="Rate Increase After 2yr (%)">
                      <input
                        type="number"
                        value={editingTerm.extension_rate_increase_percent || 10}
                        onChange={(e) =>
                          setEditingTerm({
                            ...editingTerm,
                            extension_rate_increase_percent: Number(e.target.value),
                          })
                        }
                        className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTerm.highlighted ?? false}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        highlighted: e.target.checked,
                      })
                    }
                    className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-white">Highlighted</span>
                </label>

                <Field label="Status">
                  <select
                    value={editingTerm.status || "active"}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.02] text-white text-xs px-2 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingTerm(null);
                }}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving
                  ? "Saving..."
                  : editingTerm.id
                    ? "Save Changes"
                    : "Create Term"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FIELD COMPONENT
// =============================================================================

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
