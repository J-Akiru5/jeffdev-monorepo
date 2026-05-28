"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createService, updateService } from "@/app/actions/services";
import type { Service, PricingTier, ServiceTierPricing } from "@/types/services";

interface ServiceFormProps {
  mode: "create" | "edit";
  initialData?: Service;
}

const ICON_OPTIONS = [
  "Globe", "Cloud", "Cpu", "Sparkles", "Smartphone",
  "Palette", "Briefcase", "Database", "Shield", "Code",
];

const defaultPricing = { tier: "starter" as PricingTier, price: 0, features: [""], deliveryDays: 14, revisions: 1 };

export function ServiceForm({ mode, initialData }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [tagline, setTagline] = useState(initialData?.tagline ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "Globe");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialData?.status ?? "draft"
  );
  const [highlights, setHighlights] = useState<string[]>(
    initialData?.highlights ?? [""]
  );
  const [pricing, setPricing] = useState<ServiceTierPricing[]>(
    initialData?.pricing ?? [defaultPricing]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        name,
        slug,
        tagline,
        description,
        icon,
        status,
        highlights: highlights.filter(Boolean),
        pricing: pricing.map((p) => ({
          ...p,
          features: p.features.filter(Boolean),
        })),
        featured: initialData?.featured ?? false,
        order: initialData?.order ?? 0,
        created_at: initialData?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result =
        mode === "create"
          ? await createService(payload)
          : await updateService(initialData!.id!, payload);

      if (result.success) {
        toast.success(mode === "create" ? "Service created" : "Service updated");
        router.push("/admin/services");
        router.refresh();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-4">
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          {mode === "create" ? "New Service" : "Edit Service"}
        </h1>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Create" : "Save"}
        </button>
      </div>

      <div className="mt-8 space-y-8">
        {/* Basic Info */}
        <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white">Basic Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="Web Development"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="web-development"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Icon
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published" | "archived")
                }
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
              placeholder="High-performance web applications that convert."
            />
          </div>
          <div className="mt-4">
            <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
              placeholder="Full description of the service..."
            />
          </div>
        </section>

        {/* Highlights */}
        <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Highlights</h2>
            <button
              type="button"
              onClick={() => setHighlights([...highlights, ""])}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              + Add
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h}
                  onChange={(e) => {
                    const next = [...highlights];
                    next[i] = e.target.value;
                    setHighlights(next);
                  }}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                  placeholder="Key selling point"
                />
                {highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setHighlights(highlights.filter((_, j) => j !== i))}
                    className="p-1 text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Pricing Tiers</h2>
            <button
              type="button"
              onClick={() =>
                setPricing([
                  ...pricing,
                  { tier: "starter" as PricingTier, price: 0, features: [""], deliveryDays: 14, revisions: 1 },
                ])
              }
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              + Add Tier
            </button>
          </div>
          <div className="mt-4 space-y-6">
            {pricing.map((tier, i) => (
              <div
                key={i}
                className="rounded-md border border-white/[0.06] bg-black/30 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Tier
                    </label>
                    <select
                      value={tier.tier}
                      onChange={(e) => {
                        const next = [...pricing] as any[];
                        next[i] = { ...next[i], tier: e.target.value as PricingTier };
                        setPricing(next as ServiceTierPricing[]);
                      }}
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => {
                        const next = [...pricing] as any[];
                        next[i] = { ...next[i], price: Number(e.target.value) };
                        setPricing(next as ServiceTierPricing[]);
                      }}
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Delivery (days)
                    </label>
                    <input
                      type="number"
                      value={tier.deliveryDays}
                      onChange={(e) => {
                        const next = [...pricing] as any[];
                        next[i] = { ...next[i], deliveryDays: Number(e.target.value) };
                        setPricing(next as ServiceTierPricing[]);
                      }}
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Revisions
                    </label>
                    <input
                      type="number"
                      value={tier.revisions}
                      onChange={(e) => {
                        const next = [...pricing] as any[];
                        next[i] = { ...next[i], revisions: Number(e.target.value) };
                        setPricing(next as ServiceTierPricing[]);
                      }}
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Tier Features
                  </label>
                  {tier.features.map((f: string, j: number) => (
                    <div key={j} className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={f}
                        onChange={(e) => {
                          const next = [...pricing] as any[];
                          next[i] = { ...next[i], features: (next[i].features as string[]).map((fv: string, fi: number) => fi === j ? e.target.value : fv) };
                          setPricing(next as ServiceTierPricing[]);
                        }}
                        className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                        placeholder="Feature included in this tier"
                      />
                      {tier.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...pricing] as any[];
                            next[i] = { ...next[i], features: (next[i].features as string[]).filter((_: string, k: number) => k !== j) };
                            setPricing(next as ServiceTierPricing[]);
                          }}
                          className="p-1 text-red-400/60 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...pricing] as any[];
                      next[i] = { ...next[i], features: [...(next[i].features as string[]), ""] };
                      setPricing(next as ServiceTierPricing[]);
                    }}
                    className="mt-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    + Add feature
                  </button>
                </div>
                {pricing.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPricing(pricing.filter((_, j) => j !== i))}
                    className="mt-3 text-xs text-red-400/60 hover:text-red-400"
                  >
                    Remove tier
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </form>
  );
}
