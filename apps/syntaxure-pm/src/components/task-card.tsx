"use client";

import { type ChecklistItem, deleteTask, toggleChecklistItem } from "@/app/tasks/actions";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, ProgressBar } from "@syntaxure/ui";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  deadline: string | null;
  checklist: ChecklistItem[];
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const priorityVariant: Record<string, "info" | "warning" | "danger"> = {
  low: "info",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const router = useRouter();
  const checklist = (task.checklist as ChecklistItem[]) || [];
  const completedCount = checklist.filter((i) => i.completed).length;
  const progress =
    checklist.length > 0
      ? Math.round((completedCount / checklist.length) * 100)
      : 0;

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "completed";

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      await toggleChecklistItem(task.id, itemId, completed);
      router.refresh();
    } catch {
      toast.error("Failed to update checklist");
    }
  };

  return (
    <div className="glass p-4 transition-all hover:border-white/[0.12]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white leading-tight">
          {task.title}
        </h4>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mb-2 text-xs text-zinc-500 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="mb-2 flex flex-wrap gap-1.5">
        <Badge variant={priorityVariant[task.priority] || "default"}>
          {task.priority}
        </Badge>
        <Badge>{task.category}</Badge>
      </div>

      {task.deadline && (
        <div
          className={`mb-2 flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-400" : "text-zinc-500"}`}
        >
          {isOverdue ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {new Date(task.deadline).toLocaleDateString()}
          {isOverdue && " (overdue)"}
        </div>
      )}

      {checklist.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              {completedCount}/{checklist.length} items
            </span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} size="sm" showLabel={false} />
          <div className="space-y-1">
            {checklist.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-white/[0.02]"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) =>
                    handleToggleItem(item.id, e.target.checked)
                  }
                  className="h-3 w-3 rounded border-white/[0.15] bg-white/[0.04] text-violet-500 focus:ring-violet-500/50"
                />
                <span
                  className={
                    item.completed
                      ? "text-zinc-600 line-through"
                      : "text-zinc-400"
                  }
                >
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
