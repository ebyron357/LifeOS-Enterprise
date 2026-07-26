import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { TasksView } from "@/components/vault/TasksView";
import { getAllTasks, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function TasksPage() {
  const [tasks, counts] = await Promise.all([
    getAllTasks(),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout
      title="Tasks"
      description="Open, due, overdue, and completed checklist items extracted from vault notes."
      counts={counts}
    >
      <TasksView tasks={tasks} />
    </VaultPageLayout>
  );
}
