'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { updateKpi, type Kpi } from '@/actions/kpis';
import { Pencil, Check, X } from 'lucide-react';

function KpiEditableValue({
  label,
  value,
  unit,
  onSave,
}: {
  label: string;
  value: number;
  unit: string;
  onSave: (v: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = useCallback(async () => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    setSaving(true);
    await onSave(num);
    setSaving(false);
    setEditing(false);
  }, [val, onSave]);

  const handleCancel = () => {
    setVal(String(value));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-white/40">{unit}</span>
        <input
          ref={inputRef}
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="w-20 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-sm text-white font-bold"
          disabled={saving}
        />
        <button onClick={handleSave} className="text-emerald-accent hover:text-white" disabled={saving}>
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleCancel} className="text-white/40 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-1 cursor-pointer group" onClick={() => setEditing(true)}>
      <span className="text-2xl font-bold text-white">
        {unit}{value.toLocaleString()}
      </span>
      <Pencil className="h-3 w-3 text-white/0 group-hover:text-white/30 transition-colors" />
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const percent = Math.min(Math.round((kpi.current / kpi.target) * 100), 100);

        return (
          <div key={kpi.id} className="glass rounded-lg p-4 animate-fade-in">
            <p className="text-xs font-mono uppercase tracking-wider text-white/50">{kpi.label}</p>
            <div className="mt-2">
              <KpiEditableValue
                label={kpi.label}
                value={kpi.current}
                unit={kpi.unit}
                onSave={async (v) => {
                  await updateKpi(kpi.id, { current: v });
                }}
              />
              <p className="text-xs text-white/30 mt-0.5">
                target: {kpi.unit}{kpi.target.toLocaleString()}
              </p>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-cyan-accent transition-all"
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
