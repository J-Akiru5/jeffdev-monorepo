'use client';

/**
 * Project Status Selector Component
 * -----------------------------------
 * Dropdown to change project status.
 */

import { useState, useTransition } from 'react';
import { updateProjectStatus } from '@/app/actions/project-management';
import type { ProjectStatus } from '@/types/firestore';

interface ProjectStatusSelectorProps {
  slug: string;
  currentStatus: ProjectStatus;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10' },
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10' },
  paused: { label: 'Paused', color: 'text-orange-400 bg-orange-500/10' },
  completed: { label: 'Completed', color: 'text-cyan-400 bg-cyan-500/10' },
};

export function ProjectStatusSelector({
  slug,
  currentStatus,
}: ProjectStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ProjectStatus>(currentStatus);

  const handleChange = (newStatus: ProjectStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      await updateProjectStatus(slug, newStatus);
    });
  };

  const config = statusConfig[status];

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as ProjectStatus)}
      disabled={isPending}
      className={`rounded-sm border border-transparent px-2 py-1 font-mono text-xs outline-none transition-all ${config.color} ${isPending ? 'opacity-50' : ''}`}
    >
      {Object.entries(statusConfig).map(([value, { label }]) => (
        <option key={value} value={value} className="bg-[#0a0a0a] text-white">
          {label}
        </option>
      ))}
    </select>
  );
}
