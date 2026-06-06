"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTask, updateTask, type TaskFormData, type ChecklistItem } from "@/app/tasks/actions";
import { Plus, X, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TaskFormProps {
  initialData?: TaskFormData & { id?: string };
  onClose: () => void;
}

export function TaskForm({ initialData, onClose }: TaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TaskFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "todo",
    priority: initialData?.priority || "medium",
    category: initialData?.category || "general",
    deadline: initialData?.deadline?.split("T")[0] || "",
    checklist: initialData?.checklist || [],
  });
  const [newCheckItem, setNewCheckItem] = useState("");

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newCheckItem.trim(),
      completed: false,
    };
    setForm((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), item],
    }));
    setNewCheckItem("");
  };

  const removeChecklistItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      checklist: (prev.checklist || []).filter((item) => item.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      if (initialData?.id) {
        await updateTask(initialData.id, form);
        toast.success("Task updated");
      } else {
        await createTask(form);
        toast.success("Task created");
      }
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
          placeholder="Task title"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, priority: e.target.value }))
            }
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
          >
            <option value="general">General</option>
            <option value="mcp-stability">MCP Stability</option>
            <option value="documentation">Documentation</option>
            <option value="architecture">Architecture</option>
            <option value="testing">Testing</option>
            <option value="deployment">Deployment</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          <Calendar className="mr-1 inline h-3.5 w-3.5" />
          Deadline
        </label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, deadline: e.target.value }))
          }
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
        />
      </div>

      {/* Checklist */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Checklist
        </label>
        <div className="space-y-2">
          {form.checklist?.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
            >
              <span className="flex-1 text-sm text-zinc-300">{item.text}</span>
              <button
                type="button"
                onClick={() => removeChecklistItem(item.id)}
                className="text-zinc-500 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
              placeholder="Add checklist item"
            />
            <button
              type="button"
              onClick={addChecklistItem}
              className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData?.id ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
