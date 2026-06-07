"use client";

/**
 * Calendar Legend Component
 * --------------------------
 * Shows event type color legend.
 * Accepts event types as props for flexibility.
 */

interface CalendarLegendItem {
  label: string;
  color: string;
}

interface CalendarLegendProps {
  items?: CalendarLegendItem[];
}

const defaultItems: CalendarLegendItem[] = [
  { label: "Deadline", color: "#ef4444" },
  { label: "Meeting", color: "#06b6d4" },
  { label: "Milestone", color: "#8b5cf6" },
  { label: "Reminder", color: "#f59e0b" },
  { label: "Holiday", color: "#10b981" },
];

export function CalendarLegend({ items = defaultItems }: CalendarLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-white/60">{label}</span>
        </div>
      ))}
    </div>
  );
}
