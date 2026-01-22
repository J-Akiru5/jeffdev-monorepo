'use client';

/**
 * Tasks Page
 * ----------
 * Main task list view showing all tasks organized by project.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TaskList } from '@/components/task-list';
import { useProjects } from '@/contexts/project-context';
import { Star } from 'lucide-react';
import type { Task } from '@/lib/schemas';

// Mock tasks for now (will be fetched from Firestore)
const initialMockTasks: Task[] = [
  { id: '1', projectId: '1', title: 'Review quarterly reports', completed: false, starred: true, order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', projectId: '1', title: 'Schedule team meeting', completed: false, starred: false, dueDate: '2026-01-22', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', projectId: '1', title: 'Update project documentation', completed: true, starred: false, order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', projectId: '2', title: 'Ppt Ma\'am Osano', completed: false, starred: true, order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', projectId: '2', title: 'Activity 2 and 3 Sir benj', completed: false, starred: false, order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', projectId: '2', title: 'Filmmaking 1st phase', completed: false, starred: false, order: 2, notes: 'Polish shoot list', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', projectId: '2', title: 'SineAI-Hub', completed: false, starred: true, order: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', projectId: '3', title: 'Token Ma\'am Ding', completed: false, starred: false, order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '9', projectId: '3', title: 'Promotional Video', completed: false, starred: false, order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '10', projectId: '3', title: 'IT Day Preparations', completed: false, starred: false, order: 2, notes: 'Committee', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '11', projectId: '4', title: 'Logo KampSama', completed: false, starred: false, order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '12', projectId: '5', title: 'Mantra', completed: false, starred: false, order: 0, notes: 'Short message that makes everybody aware about our...', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '13', projectId: '5', title: 'Monthly Regular Meeting', completed: false, starred: false, order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '14', projectId: '5', title: 'CBL', completed: false, starred: false, order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '15', projectId: '5', title: 'Logo making', completed: false, starred: false, order: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function TasksPage() {
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<Task[]>(initialMockTasks);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const isStarredFilter = filter === 'starred';

  // Filter tasks by active project and/or starred filter
  let filteredTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  // Apply starred filter if active
  if (isStarredFilter) {
    filteredTasks = filteredTasks.filter((t) => t.starred);
  }

  // Group tasks by project
  const tasksByProject = projects.reduce((acc, project) => {
    const projectTasks = filteredTasks.filter((t) => t.projectId === project.id);
    if (projectTasks.length > 0 || activeProjectId === project.id) {
      acc[project.id] = projectTasks;
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  const handleToggleStar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, starred: !t.starred, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleAdd = (title: string, projectId: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      projectId,
      title,
      completed: false,
      starred: false,
      order: tasks.filter((t) => t.projectId === projectId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          {isStarredFilter ? (
            <>
              <Star className="h-6 w-6 text-yellow-400" fill="currentColor" />
              Starred
            </>
          ) : activeProjectId ? (
            projects.find((p) => p.id === activeProjectId)?.name || 'Tasks'
          ) : (
            'All Tasks'
          )}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          {filteredTasks.filter((t) => !t.completed).length} tasks remaining
        </p>
      </div>

      {/* Task Lists by Project */}
      <div className="space-y-8">
        {Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
          const project = projects.find((p) => p.id === projectId);
          if (!project) return null;

          return (
            <TaskList
              key={projectId}
              tasks={projectTasks}
              project={project}
              onToggleComplete={handleToggleComplete}
              onToggleStar={handleToggleStar}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          );
        })}

        {Object.keys(tasksByProject).length === 0 && (
          <div className="py-12 text-center">
            <p className="text-white/40">No tasks yet. Create a task to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
