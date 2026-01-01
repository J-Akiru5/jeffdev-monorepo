'use client';

/**
 * Milestones List Component
 * --------------------------
 * Interactive list of project milestones with status toggles.
 */

import { useState, useTransition } from 'react';
import { Circle, CheckCircle2, Clock, Trash2, Plus } from 'lucide-react';
import { updateMilestoneStatus, deleteMilestone, addMilestone } from '@/app/actions/project-management';
import type { ProjectMilestone, MilestoneStatus } from '@/types/firestore';

interface MilestonesListProps {
  slug: string;
  milestones: ProjectMilestone[];
  onProgressUpdate?: (progress: number) => void;
}

const statusIcons = {
  pending: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
};

const statusColors = {
  pending: 'text-white/30',
  'in-progress': 'text-yellow-400',
  completed: 'text-emerald-400',
};

export function MilestonesList({ slug, milestones, onProgressUpdate }: MilestonesListProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleStatusChange = (milestoneId: string, currentStatus: MilestoneStatus) => {
    const nextStatus: Record<MilestoneStatus, MilestoneStatus> = {
      pending: 'in-progress',
      'in-progress': 'completed',
      completed: 'pending',
    };

    startTransition(async () => {
      const result = await updateMilestoneStatus(slug, milestoneId, nextStatus[currentStatus]);
      if (result.success && result.progress !== undefined && onProgressUpdate) {
        onProgressUpdate(result.progress);
      }
    });
  };

  const handleDelete = (milestoneId: string) => {
    if (!confirm('Delete this milestone?')) return;
    startTransition(async () => {
      await deleteMilestone(slug, milestoneId);
    });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await addMilestone(slug, {
        title: newTitle.trim(),
        status: 'pending',
        order: milestones.length,
      });
      setNewTitle('');
      setShowAddForm(false);
    });
  };

  return (
    <div className="space-y-2">
      {milestones.length === 0 && !showAddForm && (
        <p className="py-4 text-center text-sm text-white/30">
          No milestones yet
        </p>
      )}

      {milestones
        .sort((a, b) => a.order - b.order)
        .map((milestone) => {
          const StatusIcon = statusIcons[milestone.status];

          return (
            <div
              key={milestone.id}
              className={`flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 ${
                isPending ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => handleStatusChange(milestone.id, milestone.status)}
                disabled={isPending}
                className={`${statusColors[milestone.status]} transition-colors hover:text-white`}
              >
                <StatusIcon className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <span
                  className={`text-sm ${
                    milestone.status === 'completed'
                      ? 'text-white/40 line-through'
                      : 'text-white'
                  }`}
                >
                  {milestone.title}
                </span>
                {milestone.dueDate && (
                  <span className="ml-2 font-mono text-xs text-white/30">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDelete(milestone.id)}
                disabled={isPending}
                className="text-white/20 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

      {showAddForm ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Milestone title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newTitle.trim()}
            className="rounded-md bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddForm(false)}
            className="rounded-md px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/10 py-3 text-sm text-white/40 transition-colors hover:border-white/20 hover:text-white/60"
        >
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      )}
    </div>
  );
}
