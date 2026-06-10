import { type MilestoneStatus } from "@/lib/schemas";

export default function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const configs = {
    pending: { label: "Pending", style: "bg-zinc-800 text-zinc-400 border-zinc-700" },
    in_progress: { label: "In Progress", style: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    completed: { label: "Completed", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    blocked: { label: "Blocked", style: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  };

  const current = configs[status] || configs.pending;

  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${current.style}`}>
      {current.label}
    </span>
  );
}