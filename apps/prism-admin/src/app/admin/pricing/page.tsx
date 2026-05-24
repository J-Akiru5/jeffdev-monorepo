"use client";

/**
 * Pricing Editor Page
 *
 * Full CRUD for pricing_plans and pricing_faqs via the admin API.
 * Tabs: Plans | FAQs
 */

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Globe,
  MessageSquare,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface PricingPlan {
  id: string;
  app: "prism-engine" | "syntaxure-labs";
  plan_type: "tier" | "addon";
  name: string;
  tier_slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly_php: number | null;
  price_monthly_usd: number | null;
  price_annual_php: number | null;
  price_annual_usd: number | null;
  price_original_php: number | null;
  price_original_usd: number | null;
  discount_label: string | null;
  monthly_addon: string | null;
  features: unknown[];
  comparison_values: Record<string, unknown>;
  cta_label: string | null;
  cta_href: string | null;
  cta_variant: string;
  highlighted: boolean;
  limited_deal: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PricingFAQ {
  id: string;
  app: "prism-engine" | "syntaxure-labs";
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type Tab = "plans" | "faqs";

type AppFilter = "all" | "prism-engine" | "syntaxure-labs";

// =============================================================================
// EMPTY DEFAULTS
// =============================================================================

const emptyPlan: Partial<PricingPlan> = {
  app: "syntaxure-labs",
  plan_type: "tier",
  name: "",
  tier_slug: "",
  tagline: "",
  description: "",
  price_monthly_php: null,
  price_monthly_usd: null,
  price_annual_php: null,
  price_annual_usd: null,
  price_original_php: null,
  price_original_usd: null,
  discount_label: null,
  monthly_addon: null,
  features: [],
  comparison_values: {},
  cta_label: "Choose plan",
  cta_href: null,
  cta_variant: "secondary",
  highlighted: false,
  limited_deal: false,
  sort_order: 0,
};

const emptyFAQ: Partial<PricingFAQ> = {
  app: "syntaxure-labs",
  question: "",
  answer: "",
  sort_order: 0,
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function PricingEditorPage() {
  const [tab, setTab] = useState<Tab>("plans");
  const [appFilter, setAppFilter] = useState<AppFilter>("all");

  // Plans state
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // FAQs state
  const [faqs, setFaqs] = useState<PricingFAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<Partial<PricingFAQ> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Expanded plan detail (for viewing feature JSON)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const params = new URLSearchParams();
      if (appFilter !== "all") params.set("app", appFilter);
      const res = await fetch(`/api/admin/pricing?${params}`);
      const json = await res.json();
      setPlans(json.data || []);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setPlansLoading(false);
    }
  }, [appFilter]);

  const fetchFaqs = useCallback(async () => {
    setFaqsLoading(true);
    try {
      const params = new URLSearchParams();
      if (appFilter !== "all") params.set("app", appFilter);
      const res = await fetch(`/api/admin/pricing/faqs?${params}`);
      const json = await res.json();
      setFaqs(json.data || []);
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
    } finally {
      setFaqsLoading(false);
    }
  }, [appFilter]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  // Delete
  const handleDelete = async (id: string, type: "plan" | "faq") => {
    try {
      const endpoint =
        type === "plan" ? `/api/admin/pricing?id=${id}` : `/api/admin/pricing/faqs?id=${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        if (type === "plan") {
          setPlans((prev) => prev.filter((p) => p.id !== id));
        } else {
          setFaqs((prev) => prev.filter((f) => f.id !== id));
        }
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setConfirmDelete(null);
  };

  // Save plan
  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const isEdit = !!editingPlan.id;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch("/api/admin/pricing", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });
      const json = await res.json();
      if (json.data) {
        if (isEdit) {
          setPlans((prev) => prev.map((p) => (p.id === json.data.id ? json.data : p)));
        } else {
          setPlans((prev) => [...prev, json.data]);
          // Re-fetch to get proper sort order
          fetchPlans();
        }
        setModalOpen(false);
        setEditingPlan(null);
      } else {
        alert("Failed to save: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save FAQ
  const handleSaveFAQ = async () => {
    if (!editingFAQ) return;
    setSaving(true);
    try {
      const isEdit = !!editingFAQ.id;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch("/api/admin/pricing/faqs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFAQ),
      });
      const json = await res.json();
      if (json.data) {
        if (isEdit) {
          setFaqs((prev) => prev.map((f) => (f.id === json.data.id ? json.data : f)));
        } else {
          setFaqs((prev) => [...prev, json.data]);
          fetchFaqs();
        }
        setModalOpen(false);
        setEditingFAQ(null);
      } else {
        alert("Failed to save: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to save FAQ:", err);
    } finally {
      setSaving(false);
    }
  };

  // Move sort order up/down (simple swap with adjacent)
  const moveItem = async <T extends { id: string; sort_order: number }>(
    items: T[],
    index: number,
    direction: -1 | 1,
    type: "plan" | "faq",
  ) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const current = items[index]!;
    const target = items[targetIndex]!;
    const endpoint =
      type === "plan" ? "/api/admin/pricing" : "/api/admin/pricing/faqs";

    // Swap sort_order
    await Promise.all([
      fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, sort_order: target.sort_order }),
      }),
      fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id, sort_order: current.sort_order }),
      }),
    ]);

    if (type === "plan") fetchPlans();
    else fetchFaqs();
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pricing Editor</h1>
        <p className="text-sm text-white/50">
          Manage pricing plans and FAQs for all apps
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <TabButton
          active={tab === "plans"}
          onClick={() => setTab("plans")}
          icon={DollarSign}
          label="Plans"
          count={plans.length}
        />
        <TabButton
          active={tab === "faqs"}
          onClick={() => setTab("faqs")}
          icon={MessageSquare}
          label="FAQs"
          count={faqs.length}
        />
      </div>

      {/* App Filter + Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-white/30" />
          <select
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value as AppFilter)}
            className="h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Apps</option>
            <option value="prism-engine">Prism Engine</option>
            <option value="syntaxure-labs">Syntaxure Labs</option>
          </select>
        </div>
        <button
          onClick={() => {
            if (tab === "plans") {
              setEditingPlan({
                ...emptyPlan,
                app: appFilter !== "all" ? appFilter : "syntaxure-labs",
                sort_order: plans.length,
              });
            } else {
              setEditingFAQ({
                ...emptyFAQ,
                app: appFilter !== "all" ? appFilter : "syntaxure-labs",
                sort_order: faqs.length,
              });
            }
            setModalOpen(true);
          }}
          className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add {tab === "plans" ? "Plan" : "FAQ"}
        </button>
      </div>

      {/* Plans Tab */}
      {tab === "plans" && (
        <>
          {plansLoading ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
              <DollarSign className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">No pricing plans found</p>
              <p className="text-xs text-white/20 mt-1">Click &quot;Add Plan&quot; to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors"
                >
                  {/* Plan header */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 opacity-30 hover:opacity-100">
                      <button
                        onClick={() => moveItem(plans, index, -1, "plan")}
                        disabled={index === 0}
                        className="disabled:opacity-20"
                      >
                        <ChevronUp className="h-3 w-3 text-white/60" />
                      </button>
                      <button
                        onClick={() => moveItem(plans, index, 1, "plan")}
                        disabled={index === plans.length - 1}
                        className="disabled:opacity-20"
                      >
                        <ChevronDown className="h-3 w-3 text-white/60" />
                      </button>
                    </div>

                    {/* App badge */}
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${
                        plan.app === "prism-engine"
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-violet-400 bg-violet-500/10"
                      }`}
                    >
                      {plan.app === "prism-engine" ? "Engine" : "Labs"}
                    </span>

                    {/* Type badge */}
                    {plan.plan_type === "addon" && (
                      <span className="text-[10px] font-mono uppercase px-2 py-1 rounded text-emerald-400 bg-emerald-500/10">
                        Addon
                      </span>
                    )}

                    {/* Name & slug */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white">
                          {plan.name}
                        </h3>
                        {plan.highlighted && (
                          <Sparkles className="h-3 w-3 text-amber-400" />
                        )}
                        {plan.limited_deal && (
                          <span className="text-[10px] font-mono text-amber-400">
                            LIMITED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 font-mono">
                        {plan.tier_slug}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      {plan.price_monthly_usd !== null ? (
                        <div>
                          <span className="text-sm font-mono text-white">
                            ${plan.price_monthly_usd.toLocaleString()}
                          </span>
                          <span className="text-xs text-white/40">/mo</span>
                          <br />
                          {plan.price_annual_usd !== null && (
                            <span className="text-[10px] text-white/30 font-mono">
                              ${plan.price_annual_usd.toLocaleString()}/yr
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-mono text-white/60">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setExpandedPlan(
                            expandedPlan === plan.id ? null : plan.id,
                          );
                        }}
                        className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        title="View details"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedPlan === plan.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(plan.id)}
                        className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedPlan === plan.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-white/5">
                      <div className="mt-3 grid gap-3 text-xs text-white/60">
                        <div>
                          <span className="text-white/30">Tagline:</span>{" "}
                          {plan.tagline || "—"}
                        </div>
                        <div>
                          <span className="text-white/30">Description:</span>{" "}
                          {plan.description || "—"}
                        </div>
                        {plan.discount_label && (
                          <div>
                            <span className="text-white/30">Discount:</span>{" "}
                            <span className="text-amber-400">
                              {plan.discount_label}
                            </span>
                            {plan.monthly_addon && (
                              <span className="text-emerald-400">
                                {" "}— {plan.monthly_addon}
                              </span>
                            )}
                          </div>
                        )}
                        <div>
                          <span className="text-white/30">CTA:</span>{" "}
                          {plan.cta_label || "—"}{" "}
                          <span className="text-white/20">
                            ({plan.cta_variant})
                          </span>
                          {plan.cta_href && (
                            <span className="text-white/20 ml-1">
                              → {plan.cta_href}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-white/30">Features:</span>
                          <pre className="mt-1 p-2 rounded bg-white/[0.02] text-white/40 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(plan.features, null, 2)
                              .slice(0, 500)
                              .concat(
                                JSON.stringify(plan.features, null, 2).length >
                                  500
                                  ? "..."
                                  : "",
                              )}
                          </pre>
                        </div>
                        <div>
                          <span className="text-white/30">Sort order:</span>{" "}
                          {plan.sort_order}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {confirmDelete === plan.id && (
                    <div className="px-4 pb-4 flex items-center gap-3">
                      <span className="text-xs text-red-400">
                        Delete &quot;{plan.name}&quot;?
                      </span>
                      <button
                        onClick={() => handleDelete(plan.id, "plan")}
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
        </>
      )}

      {/* FAQs Tab */}
      {tab === "faqs" && (
        <>
          {faqsLoading ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">Loading FAQs...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
              <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">No FAQs found</p>
              <p className="text-xs text-white/20 mt-1">Click &quot;Add FAQ&quot; to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 opacity-30 hover:opacity-100">
                      <button
                        onClick={() => moveItem(faqs, index, -1, "faq")}
                        disabled={index === 0}
                        className="disabled:opacity-20"
                      >
                        <ChevronUp className="h-3 w-3 text-white/60" />
                      </button>
                      <button
                        onClick={() => moveItem(faqs, index, 1, "faq")}
                        disabled={index === faqs.length - 1}
                        className="disabled:opacity-20"
                      >
                        <ChevronDown className="h-3 w-3 text-white/60" />
                      </button>
                    </div>

                    {/* App badge */}
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${
                        faq.app === "prism-engine"
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-violet-400 bg-violet-500/10"
                      }`}
                    >
                      {faq.app === "prism-engine" ? "Engine" : "Labs"}
                    </span>

                    {/* Question (truncated) */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {faq.question}
                      </p>
                      <p className="text-xs text-white/40 truncate mt-0.5">
                        {faq.answer.slice(0, 120)}
                        {faq.answer.length > 120 ? "..." : ""}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingFAQ(faq);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(faq.id)}
                        className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {confirmDelete === faq.id && (
                    <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3">
                      <span className="text-xs text-red-400">
                        Delete this FAQ?
                      </span>
                      <button
                        onClick={() => handleDelete(faq.id, "faq")}
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
        </>
      )}

      {/* ================================================================ */}
      {/* MODAL — Plan Editor */}
      {/* ================================================================ */}
      {modalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#050505] p-6">
            <h2 className="text-lg font-semibold text-white mb-6">
              {editingPlan.id ? "Edit Plan" : "New Plan"}
            </h2>

            <div className="space-y-4">
              {/* App + Type */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="App">
                  <select
                    value={editingPlan.app || "syntaxure-labs"}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        app: e.target.value as "prism-engine" | "syntaxure-labs",
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="prism-engine">Prism Engine</option>
                    <option value="syntaxure-labs">Syntaxure Labs</option>
                  </select>
                </Field>
                <Field label="Type">
                  <select
                    value={editingPlan.plan_type || "tier"}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        plan_type: e.target.value as "tier" | "addon",
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="tier">Tier</option>
                    <option value="addon">Add-on</option>
                  </select>
                </Field>
              </div>

              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name">
                  <input
                    value={editingPlan.name || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                    placeholder="Pro"
                  />
                </Field>
                <Field label="Slug">
                  <input
                    value={editingPlan.tier_slug || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        tier_slug: e.target.value,
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="pro"
                  />
                </Field>
              </div>

              {/* Tagline */}
              <Field label="Tagline">
                <input
                  value={editingPlan.tagline || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, tagline: e.target.value })
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  placeholder="For serious developers"
                />
              </Field>

              {/* Description */}
              <Field label="Description">
                <textarea
                  value={editingPlan.description || ""}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50 resize-none"
                  placeholder="Unlimited rules, IDE auto-sync..."
                />
              </Field>

              {/* Pricing */}
              <div>
                <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                  Pricing (USD)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={editingPlan.price_monthly_usd ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_monthly_usd: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    type="number"
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="Monthly USD"
                  />
                  <input
                    value={editingPlan.price_annual_usd ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_annual_usd: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    type="number"
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="Annual USD"
                  />
                </div>
              </div>

              {/* PHP Pricing (for syntaxure-labs) */}
              {editingPlan.app === "syntaxure-labs" && (
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                    Pricing (PHP)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      value={editingPlan.price_monthly_php ?? ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price_monthly_php: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      type="number"
                      className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                      placeholder="Monthly PHP"
                    />
                    <input
                      value={editingPlan.price_annual_php ?? ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price_annual_php: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      type="number"
                      className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                      placeholder="Annual PHP"
                    />
                  </div>
                </div>
              )}

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Discount Label">
                  <input
                    value={editingPlan.discount_label || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        discount_label: e.target.value || null,
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                    placeholder="44% OFF"
                  />
                </Field>
                <Field label="Monthly Addon">
                  <input
                    value={editingPlan.monthly_addon || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        monthly_addon: e.target.value || null,
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                    placeholder="+3 mo. free"
                  />
                </Field>
              </div>

              {/* Original pricing */}
              {editingPlan.discount_label && (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={editingPlan.price_original_usd ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_original_usd: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    type="number"
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="Original USD price"
                  />
                  <input
                    value={editingPlan.price_original_php ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_original_php: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    type="number"
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="Original PHP price"
                  />
                </div>
              )}

              {/* Features (simple textarea JSON editor) */}
              <Field label="Features (JSON array)">
                <textarea
                  value={JSON.stringify(editingPlan.features || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditingPlan({ ...editingPlan, features: parsed });
                    } catch {
                      // Allow invalid JSON while editing
                    }
                  }}
                  rows={6}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] text-white/80 text-xs font-mono px-3 py-2 focus:outline-none focus:border-amber-500/50"
                  placeholder='[{"label": "Feature", "included": true}]'
                />
              </Field>

              {/* Comparison values JSON */}
              <Field label="Comparison Values (JSON object)">
                <textarea
                  value={JSON.stringify(
                    editingPlan.comparison_values || {},
                    null,
                    2,
                  )}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditingPlan({
                        ...editingPlan,
                        comparison_values: parsed,
                      });
                    } catch {
                      // Allow invalid JSON while editing
                    }
                  }}
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] text-white/80 text-xs font-mono px-3 py-2 focus:outline-none focus:border-amber-500/50"
                  placeholder='{"feature": "value"}'
                />
              </Field>

              {/* CTA */}
              <div className="grid grid-cols-3 gap-4">
                <Field label="CTA Label">
                  <input
                    value={editingPlan.cta_label || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        cta_label: e.target.value,
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                    placeholder="Choose plan"
                  />
                </Field>
                <Field label="CTA Href">
                  <input
                    value={editingPlan.cta_href || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        cta_href: e.target.value || null,
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="/quote?tier=pro"
                  />
                </Field>
                <Field label="CTA Variant">
                  <select
                    value={editingPlan.cta_variant || "secondary"}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        cta_variant: e.target.value as
                          | "primary"
                          | "secondary"
                          | "contact",
                      })
                    }
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="contact">Contact</option>
                  </select>
                </Field>
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.highlighted || false}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        highlighted: e.target.checked,
                      })
                    }
                    className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-white">Highlighted (Popular)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.limited_deal || false}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        limited_deal: e.target.checked,
                      })
                    }
                    className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-white">Limited Deal</span>
                </label>
              </div>

              {/* Sort order */}
              <Field label="Sort Order">
                <input
                  value={editingPlan.sort_order ?? 0}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      sort_order: Number(e.target.value),
                    })
                  }
                  type="number"
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </Field>
            </div>

            {/* Modal actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving || !editingPlan.name || !editingPlan.tier_slug}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editingPlan.id ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL — FAQ Editor */}
      {/* ================================================================ */}
      {modalOpen && editingFAQ && !editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#050505] p-6">
            <h2 className="text-lg font-semibold text-white mb-6">
              {editingFAQ.id ? "Edit FAQ" : "New FAQ"}
            </h2>

            <div className="space-y-4">
              <Field label="App">
                <select
                  value={editingFAQ.app || "syntaxure-labs"}
                  onChange={(e) =>
                    setEditingFAQ({
                      ...editingFAQ,
                      app: e.target.value as "prism-engine" | "syntaxure-labs",
                    })
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="prism-engine">Prism Engine</option>
                  <option value="syntaxure-labs">Syntaxure Labs</option>
                </select>
              </Field>

              <Field label="Question">
                <input
                  value={editingFAQ.question || ""}
                  onChange={(e) =>
                    setEditingFAQ({ ...editingFAQ, question: e.target.value })
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  placeholder="Can I cancel anytime?"
                />
              </Field>

              <Field label="Answer">
                <textarea
                  value={editingFAQ.answer || ""}
                  onChange={(e) =>
                    setEditingFAQ({ ...editingFAQ, answer: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50 resize-none"
                  placeholder="Yes, you can cancel at any time..."
                />
              </Field>

              <Field label="Sort Order">
                <input
                  value={editingFAQ.sort_order ?? 0}
                  onChange={(e) =>
                    setEditingFAQ({
                      ...editingFAQ,
                      sort_order: Number(e.target.value),
                    })
                  }
                  type="number"
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingFAQ(null);
                }}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFAQ}
                disabled={saving || !editingFAQ.question || !editingFAQ.answer}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving
                  ? "Saving..."
                  : editingFAQ.id
                    ? "Save Changes"
                    : "Create FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof DollarSign;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={`text-[10px] font-mono ${
          active ? "text-amber-400/60" : "text-white/20"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

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
