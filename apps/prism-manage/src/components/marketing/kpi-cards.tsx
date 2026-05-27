"use client";

import { useState, useCallback, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { updateKpi } from "@/app/actions/marketing";
import type { MarketingKpi } from "@/lib/schemas";
import { toast } from "sonner";

function KpiEditableValue({
  value,
  unit,
  onSave,
}: {
  value: number;
  unit: string;
  onSave: (v: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    const num = Number(editValue);
    if (isNaN(num)) return;
    setSaving(true);
    try {
      await onSave(num);
      setEditing(false);
    } catch {
      toast.error("Failed to save KPI value");
    }
    setSaving(false);
  }, [editValue, onSave]);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(Number(e.target.value))}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-24 bg-white/10 border border-cyan-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-400"
          autoFocus
          disabled={saving}
        />
        {saving && <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Edit value"
      className="group flex items-center gap-1 cursor-pointer"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditing(true); }}
    >
      <span className="text-2xl font-bold text-white">
        {unit}
        {value.toLocaleString()}
      </span>
      <Pencil className="h-3 w-3 text-white/0 group-hover:text-white/30 transition-colors" />
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: MarketingKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const percent = Math.min(
          kpi.target > 0
            ? Math.round((kpi.current / kpi.target) * 100)
            : 0,
          100
        );

        return (
          <div key={kpi.id} className="glass rounded-lg p-4 animate-fade-in">
            <p className="text-xs font-mono uppercase tracking-wider text-white/50">
              {kpi.label}
            </p>
            <div className="mt-2">
              <KpiEditableValue
                value={kpi.current}
                unit={kpi.unit}
                onSave={async (v) => {
                  await updateKpi(kpi.id, { current: v });
                }}
              />
              <p className="text-xs text-white/30 mt-0.5">
                target: {kpi.unit}
                {kpi.target.toLocaleString()}
              </p>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-white/40">{percent}% of target</p>
          </div>
        );
      })}
    </div>
  );
}
