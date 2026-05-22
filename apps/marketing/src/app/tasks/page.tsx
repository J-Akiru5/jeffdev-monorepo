import { getTasks } from '@/actions/github';
import { TaskBoard } from '@/components/task-board';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; owner?: string }>;
}) {
  const params = await searchParams;
  const allTasks = await getTasks();

  let filtered = [...allTasks];

  if (params.phase) {
    filtered = filtered.filter((t) => t.phase === params.phase);
  }

  if (params.owner) {
    const ownerFilter = params.owner.toLowerCase();
    filtered = filtered.filter((t) => t.owner.includes(ownerFilter));
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <TaskBoard tasks={allTasks} initialFiltered={filtered} phase={params.phase} owner={params.owner} />
    </main>
  );
}
