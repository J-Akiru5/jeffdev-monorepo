import { getTasks } from "@/app/tasks/actions";
import { TaskBoard } from "@/components/task-board";
import { TaskFilters } from "@/components/task-filters";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; category?: string }>;
}) {
  const params = await searchParams;
  const tasks = await getTasks({
    status: params.status,
    priority: params.priority,
    category: params.category,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track checklists, deadlines, and milestones
          </p>
        </div>
      </div>

      <TaskFilters />
      <TaskBoard tasks={tasks} />
    </div>
  );
}
