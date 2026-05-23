'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { type Task, type TaskStatus, getTasks } from '@/actions/github';
import { TaskCard } from '@/components/task-card';
import { TaskForm } from '@/components/task-form';
import { team } from '@/data/team';

const statusConfig: Record<TaskStatus, { label: string }> = {
  todo: { label: 'To Do' },
  'in-progress': { label: 'In Progress' },
  done: { label: 'Done' },
};

const PHASES = [
  { value: 'phase-1', label: 'Phase 1' },
  { value: 'phase-2', label: 'Phase 2' },
  { value: 'phase-3', label: 'Phase 3' },
  { value: 'ongoing', label: 'Ongoing' },
];

function columnTitleColor(status: TaskStatus): string {
  if (status === 'todo') return 'text-white/50';
  if (status === 'in-progress') return 'text-cyan-accent';
  return 'text-emerald-accent';
}

type Filter = { phase?: string; owner?: string };

export function TaskBoard({
  tasks: initialTasks,
  phase: initialPhase,
  owner: initialOwner,
}: {
  tasks: Task[];
  initialFiltered: Task[];
  phase?: string;
  owner?: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<Filter>({
    phase: initialPhase,
    owner: initialOwner,
  });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const fresh = await getTasks();
    setTasks(fresh);
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (filter.phase) {
      result = result.filter((t) => t.phase === filter.phase);
    }
    if (filter.owner) {
      result = result.filter((t) => t.owner.includes(filter.owner!.toLowerCase()));
    }
    return result;
  }, [tasks, filter]);

  const columns: TaskStatus[] = ['todo', 'in-progress', 'done'];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-white">Task Board</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="glass inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <TaskForm />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {/* Phase filter */}
          <div className="flex items-center gap-1">
            <select
              value={filter.phase || ''}
              onChange={(e) => setFilter({ ...filter, phase: e.target.value || undefined })}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white/70"
            >
              <option value="" className="bg-black">All Phases</option>
              {PHASES.map((p) => (
                <option key={p.value} value={p.value} className="bg-black">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Owner filter */}
          <div className="flex items-center gap-1">
            <select
              value={filter.owner || ''}
              onChange={(e) => setFilter({ ...filter, owner: e.target.value || undefined })}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white/70"
            >
              <option value="" className="bg-black">All Owners</option>
              {team.map((m) => (
                <option key={m.id} value={m.id} className="bg-black">
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Active filter badges */}
          {(filter.phase || filter.owner) && (
            <button
              onClick={() => setFilter({})}
              className="text-xs text-rose-accent hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}

          <span className="text-xs text-white/30 ml-auto">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((status) => {
          const columnTasks = filtered.filter((t) => t.status === status);
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-2 w-2 rounded-full ${status === 'todo' ? 'bg-white/30' : status === 'in-progress' ? 'bg-cyan-accent' : 'bg-emerald-accent'}`} />
                <h2 className={`text-sm font-mono uppercase tracking-wider ${columnTitleColor(status)}`}>
                  {statusConfig[status].label}
                </h2>
                <span className="text-xs text-white/30 ml-auto">{columnTasks.length}</span>
              </div>
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="glass rounded-lg p-6 text-center">
                    <p className="text-sm text-white/30 italic">No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
