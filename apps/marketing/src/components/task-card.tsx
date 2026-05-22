'use client';

import { useState, useCallback } from 'react';
import { Circle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { updateTaskStatus, type Task, type TaskStatus } from '@/actions/github';

const priorityColor: Record<string, string> = {
  high: 'text-rose-accent',
  medium: 'text-amber-accent',
  low: 'text-white/40',
};

const statusDotColor: Record<TaskStatus, string> = {
  todo: 'bg-white/30',
  'in-progress': 'bg-cyan-accent',
  done: 'bg-emerald-accent',
};

export function TaskCard({ task }: { task: Task }) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const cycleStatus = useCallback(async () => {
    const order: TaskStatus[] = ['todo', 'in-progress', 'done'];
    const next = order[(order.indexOf(status) + 1) % order.length];
    setStatus(next);
    setUpdating(true);
    try {
      await updateTaskStatus(task.id, next);
    } catch {
      setStatus(status);
    }
    setUpdating(false);
  }, [status, task.id]);

  return (
    <div className="glass rounded-lg p-3 animate-fade-in">
      {/* Title row */}
      <div className="flex items-start gap-2">
        <button
          onClick={cycleStatus}
          disabled={updating}
          title={`Click to: ${status === 'todo' ? 'In Progress' : status === 'in-progress' ? 'Done' : 'Reopen'}`}
          className="mt-1 shrink-0"
        >
          <div className={`h-3 w-3 rounded-full cursor-pointer transition-colors hover:ring-2 hover:ring-white/20 ${statusDotColor[status]} ${updating ? 'opacity-50' : ''}`} />
        </button>
        <p className="text-sm text-white/90 font-medium leading-snug flex-1">
          {task.title}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <Circle className={`h-2 w-2 fill-current ${priorityColor[task.priority]}`} />
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/20 hover:text-white/60 transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {task.owner.map((o) => (
          <span key={o} className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/60">
            {o}
          </span>
        ))}
        {task.platform && (
          <span className="text-[10px] font-mono text-white/30">{task.platform}</span>
        )}
        <span className="text-[10px] font-mono text-white/20">{task.phase.replace('-', ' ')}</span>
      </div>

      {/* Expand for description */}
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
