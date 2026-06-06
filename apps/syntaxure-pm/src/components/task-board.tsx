"use client";

import { useState } from "react";
import { type ChecklistItem } from "@/app/tasks/actions";
import { Plus } from "lucide-react";
import { TaskForm } from "./task-form";
import { TaskCard } from "./task-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  deadline: string | null;
  checklist: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

interface TaskBoardProps {
  tasks: Task[];
}

const columns = [
  { id: "backlog", label: "Backlog", color: "text-zinc-400" },
  { id: "todo", label: "To Do", color: "text-blue-400" },
  { id: "in_progress", label: "In Progress", color: "text-yellow-400" },
  { id: "in_review", label: "In Review", color: "text-purple-400" },
  { id: "completed", label: "Completed", color: "text-green-400" },
];

export function TaskBoard({ tasks }: TaskBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-medium ${col.color}`}>
                  {col.label}
                </h3>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => setEditingTask(task)}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/[0.06] p-4 text-center text-xs text-zinc-600">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showForm || !!editingTask} onOpenChange={() => {
        setShowForm(false);
        setEditingTask(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create Task"}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            initialData={
              editingTask
                ? {
                    ...editingTask,
                    description: editingTask.description ?? undefined,
                    deadline: editingTask.deadline ?? undefined,
                  }
                : undefined
            }
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
