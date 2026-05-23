'use client';

/**
 * Kanban Page
 * -----------
 * Drag-and-drop kanban board for visual task management.
 */

import { useState } from 'react';
import { useProjects } from '@/contexts/project-context';
import { GripVertical, Plus } from 'lucide-react';
import type { Task } from '@/lib/schemas';

type KanbanColumn = 'backlog' | 'in_progress' | 'done';

interface KanbanTask extends Task {
  column: KanbanColumn;
}

// Mock tasks for kanban
const initialKanbanTasks: KanbanTask[] = [
  { id: '1', projectId: '1', title: 'Review quarterly reports', completed: false, starred: true, order: 0, column: 'in_progress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', projectId: '1', title: 'Schedule team meeting', completed: false, starred: false, order: 1, column: 'backlog', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', projectId: '1', title: 'Update project documentation', completed: true, starred: false, order: 2, column: 'done', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', projectId: '2', title: 'Ppt Ma\'am Osano', completed: false, starred: false, order: 0, column: 'backlog', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', projectId: '2', title: 'Activity 2 and 3 Sir benj', completed: false, starred: false, order: 1, column: 'in_progress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', projectId: '2', title: 'Filmmaking 1st phase', completed: false, starred: false, order: 2, column: 'backlog', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', projectId: '3', title: 'Token Ma\'am Ding', completed: false, starred: false, order: 0, column: 'in_progress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', projectId: '5', title: 'Monthly Regular Meeting', completed: true, starred: false, order: 1, column: 'done', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const columns: { id: KanbanColumn; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

export default function KanbanPage() {
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<KanbanTask[]>(initialKanbanTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Filter tasks by active project
  const filteredTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (column: KanbanColumn) => {
    if (draggedTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask
            ? { ...t, column, completed: column === 'done', updatedAt: new Date().toISOString() }
            : t
        )
      );
      setDraggedTask(null);
    }
  };

  const getTasksByColumn = (columnId: KanbanColumn) => {
    return filteredTasks.filter((t) => t.column === columnId);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
        <p className="mt-1 text-sm text-white/40">
          Drag and drop tasks between columns
        </p>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <div
            key={column.id}
            className="min-h-[400px] rounded-xl border border-white/10 bg-white/[0.02] p-4"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="mb-4 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <span className="ml-auto font-mono text-xs text-white/30">
                {getTasksByColumn(column.id).length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {getTasksByColumn(column.id).map((task) => {
                const project = projects.find((p) => p.id === task.projectId);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={`cursor-grab rounded-lg border border-white/5 bg-white/[0.04] p-3 transition-all hover:border-white/10 active:cursor-grabbing ${
                      draggedTask === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/20" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">{task.title}</p>
                        {project && (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: project.color || '#06b6d4' }}
                            />
                            <span className="text-[11px] text-white/40">
                              {project.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Task Button */}
              <button className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-sm text-white/30 transition-colors hover:border-white/20 hover:text-white/50">
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
