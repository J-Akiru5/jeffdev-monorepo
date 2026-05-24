"use client";

import { useState, useCallback } from "react";
import { Circle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { updateMarketingTaskStatus } from "@/app/actions/marketing";
import type { MarketingTask, MarketingTeamMember } from "@/lib/schemas";

const priorityColor: Record<string, string> = {
  high: "text-rose-400",
  medium: "text-amber-400",
  low: "text-white/40",
};

const statusDotColor: Record<string, string> = {
  todo: "bg-white/30",
  "in-progress": "bg-cyan-400",
  done: "bg-emerald-400",
};

const nextStatus: Record<string, string> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

export function TaskCard({
  task,
  team,
}: {
  task: MarketingTask;
  team: MarketingTeamMember[];
}) {
  const [status, setStatus] = useState(task.status);
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const cycleStatus = useCallback(async () => {
    const next = nextStatus[status] as "todo" | "in-progress" | "done";
    setStatus(next);
    setUpdating(true);
    try {
      await updateMarketingTaskStatus(task.id, next);
    } catch {
      setStatus(status);
    }
    setUpdating(false);
  }, [status, task.id]);

  const getOwnerInitials = (ownerId: string) => {
    return team.find((m) => m.id === ownerId)?.initials || ownerId;
  };

  const githubUrl = task.githubIssueNumber
    ? `https://github.com/issues/${task.githubIssueNumber}`
    : null;

  return (
    <div className="glass rounded-lg p-3 animate-fade-in">
      <div className="flex items-start gap-2">
        <button
          onClick={cycleStatus}
          disabled={updating}
          title={`Click to: ${nextStatus[status]}`}
          className="mt-1 shrink-0"
        >
          <div
            className={`h-3 w-3 rounded-full cursor-pointer transition-colors hover:ring-2 hover:ring-white/20 ${statusDotColor[status]} ${updating ? "opacity-50" : ""}`}
          />
        </button>
        <p className="text-sm text-white/90 font-medium leading-snug flex-1">
          {task.title}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <Circle className={`h-2 w-2 fill-current ${priorityColor[task.priority]}`} />
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 hover:text-white/60 transition-colors"
              title="Open on GitHub"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {task.ownerIds.map((o) => (
          <span
            key={o}
            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/60"
          >
            {getOwnerInitials(o)}
          </span>
        ))}
        {task.platform && (
          <span className="text-[10px] font-mono text-white/30">{task.platform}</span>
        )}
        <span className="text-[10px] font-mono text-white/20">
          {task.phaseId.replace("-", " ")}
        </span>
      </div>

      {task.description && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show details
              </>
            )}
          </button>
          {expanded && (
            <p className="mt-1.5 text-xs text-white/40 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
