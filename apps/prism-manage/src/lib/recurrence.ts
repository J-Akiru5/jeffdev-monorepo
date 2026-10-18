/**
 * Recurring tasks — next occurrence date
 * --------------------------------------
 * Pure helper: given the current due date (YYYY-MM-DD or null) and a
 * recurrence, compute the next occurrence's due date. If the base date is
 * already in the past, the next occurrence is measured from "now" so a
 * neglected task doesn't spawn a chain of overdue occurrences.
 */

export type Recurrence = "daily" | "weekly" | "monthly";

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function isRecurrence(value: unknown): value is Recurrence {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function advance(date: Date, recurrence: Recurrence): Date {
  const d = new Date(date);
  if (recurrence === "daily") d.setDate(d.getDate() + 1);
  else if (recurrence === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function nextOccurrenceDate(
  dueDate: string | null | undefined,
  recurrence: Recurrence,
  now: Date = new Date(),
): string {
  const base = dueDate ? new Date(`${dueDate}T00:00:00Z`) : now;
  const next = advance(base, recurrence);
  if (next.getTime() <= now.getTime()) {
    return toDateString(advance(now, recurrence));
  }
  return toDateString(next);
}
