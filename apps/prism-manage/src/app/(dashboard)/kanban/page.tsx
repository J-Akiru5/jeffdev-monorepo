'use client';

/**
 * Kanban Page
 * -----------
 * Drag-and-drop kanban board for visual task management with Supabase persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/contexts/project-context';
import { GripVertical, Plus } from 'lucide-react';
import { updateTaskStatus, createTask } from '@/app/actions/tasks';
import type { Task } from '@/lib/schemas';
import { toast } from 'sonner';

type KanbanColumn = 'backlog' | 'in_progress' | 'done';

interface KanbanTask extends Task {
  column: KanbanColumn;
}

const columns: { id: KanbanColumn; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

export default function KanbanPage() {
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Fetch tasks from Supabase
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        // Map API tasks to kanban format with column assignment
        const mapped: KanbanTask[] = (data || []).map((t: any) => ({
          id: t.id?.toString() || String(Math.random()),
          projectId: t.project_id || t.projectId || '',
          title: t.title,
          completed: t.status === 'done',
          starred: t.priority ? t.priority > 0 : false,
          order: t.order || 0,
          notes: t.notes || t.description || '',
          column: mapStatusToColumn(t.status || 'todo'),
          createdAt: t.created_at || t.createdAt || new Date().toISOString(),
          updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
        }));
        setTasks(mapped);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const filteredTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (column: KanbanColumn) => {
    if (!draggedTask) return;

    const task = tasks.find((t) => t.id === draggedTask);
    if (!task) return;

    try {
      await updateTaskStatus(draggedTask, column === 'done' ? 'done' : column);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask
            ? { ...t, column, completed: column === 'done', updatedAt: new Date().toISOString() }
            : t
        )
      );
    } catch (err) {
      toast.error('Failed to update task status');
    }
    setDraggedTask(null);
  };

  const handleAddTask = async (column: KanbanColumn) => {
    const title = prompt('Task title:');
    if (!title) return;

    const projectId = activeProjectId || projects[0]?.id || '1';
    try {
      await createTask({ title, projectId: projectId.toString() });
      const newTask: KanbanTask = {
        id: Date.now().toString(),
        projectId: projectId.toString(),
        title,
        completed: false,
        starred: false,
        order: tasks.filter((t) => t.projectId === projectId).length,
        column,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      toast.success('Task added');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const getTasksByColumn = (columnId: KanbanColumn) => {
    return filteredTasks.filter((t) => t.column === columnId);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      </div>
    );
  }

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
              <button
                onClick={() => handleAddTask(column.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-sm text-white/30 transition-colors hover:border-white/20 hover:text-white/50"
              >
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

function mapStatusToColumn(status: string): KanbanColumn {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'done':
      return 'done';
    default:
      return 'backlog';
  }
}
