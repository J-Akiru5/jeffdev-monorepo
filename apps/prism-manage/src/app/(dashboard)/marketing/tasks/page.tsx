import { getMarketingTasks, getMarketingTeam } from "@/app/actions/marketing";
import { TaskBoard } from "@/components/marketing/task-board";

export const dynamic = "force-dynamic";

export default async function MarketingTasksPage() {
  const [tasks, team] = await Promise.all([
    getMarketingTasks(),
    getMarketingTeam(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <TaskBoard tasks={tasks} team={team} />
    </div>
  );
}
