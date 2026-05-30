"use client";

/**
 * Customization Services Page
 *
 * Lists and manages customization services that trigger separate quotations.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Clock,
} from "lucide-react";
import {
  getCustomizationServices,
  deleteCustomizationService,
} from "@/app/actions/products";
import { CustomizationServiceForm } from "@/components/admin/customization-service-form";

// =============================================================================
// TYPES
// =============================================================================

interface CustomizationService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricing_model: "fixed" | "hourly" | "project";
  estimated_range_min_php: number | null;
  estimated_range_max_php: number | null;
  estimated_range_min_usd: number | null;
  estimated_range_max_usd: number | null;
  turnaround_days: number | null;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PRICING MODEL CONFIG
// =============================================================================

const pricingModelConfig: Record<string, { label: string; color: string }> = {
  fixed: { label: "Fixed Price", color: "text-cyan-400 bg-cyan-500/10" },
  hourly: { label: "Hourly Rate", color: "text-violet-400 bg-violet-500/10" },
  project: { label: "Project Based", color: "text-amber-400 bg-amber-500/10" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10" },
  inactive: { label: "Inactive", color: "text-white/40 bg-white/5" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CustomizationServicesPage() {
  const [services, setServices] = useState<CustomizationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CustomizationService | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const result = await getCustomizationServices();
    if (result.success && result.data) {
      setServices(result.data as CustomizationService[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = async (id: string) => {
    const result = await deleteCustomizationService(id);
    if (result.success) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
    setConfirmDelete(null);
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditingService(null);
    fetchServices();
  };

  const formatPriceRange = (
    minPhp: number | null,
    maxPhp: number | null,
    minUsd: number | null,
    maxUsd: number | null
  ) => {
    const parts: string[] = [];
    if (minPhp !== null && maxPhp !== null) {
      parts.push(`₱${minPhp.toLocaleString()} - ₱${maxPhp.toLocaleString()}`);
    } else if (minPhp !== null) {
      parts.push(`₱${minPhp.toLocaleString()}`);
    }
    if (minUsd !== null && maxUsd !== null) {
      parts.push(`$${minUsd.toLocaleString()} - $${maxUsd.toLocaleString()}`);
    } else if (minUsd !== null) {
      parts.push(`$${minUsd.toLocaleString()}`);
    }
    return parts.join(" / ") || "Custom";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customization Services</h1>
          <p className="text-sm text-white/50">
            Services that trigger separate quotations (branding, features, integrations, rewrites)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setModalOpen(true);
          }}
          className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-white/40 text-sm">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
          <Wrench className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No customization services found</p>
          <p className="text-xs text-white/20 mt-1">
            Click &quot;Add Service&quot; to create one
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => {
            const modelConf = pricingModelConfig[service.pricing_model] || { label: "Fixed", color: "text-white/40 bg-white/5" };
            const statusConf = statusConfig[service.status] || { label: "Active", color: "text-emerald-400 bg-emerald-500/10" };

            return (
              <div
                key={service.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-white/5">
                    <Wrench className="h-4 w-4 text-white/40" />
                  </div>

                  {/* Name & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">
                        {service.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${modelConf.color}`}
                      >
                        {modelConf.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${statusConf.color}`}
                      >
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {service.description || "—"}
                    </p>
                  </div>

                  {/* Price Range */}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-mono text-white">
                      {formatPriceRange(
                        service.estimated_range_min_php,
                        service.estimated_range_max_php,
                        service.estimated_range_min_usd,
                        service.estimated_range_max_usd
                      )}
                    </p>
                  </div>

                  {/* Turnaround */}
                  {service.turnaround_days && (
                    <div className="hidden md:flex items-center gap-1 text-white/40">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">{service.turnaround_days}d</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingService(service);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(service.id)}
                      className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {confirmDelete === service.id && (
                  <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3">
                    <span className="text-xs text-red-400">
                      Delete &quot;{service.name}&quot;?
                    </span>
                    <button
                      onClick={() => handleDelete(service.id)}
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
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <CustomizationServiceForm
          service={editingService}
          onClose={() => {
            setModalOpen(false);
            setEditingService(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
