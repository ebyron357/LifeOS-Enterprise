import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { ProjectsView } from "@/components/vault/ProjectsView";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function ProjectsPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("projects"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout
      title="Projects"
      description="Active, waiting, and blocked project records from the canonical vault."
      counts={counts}
    >
      <ProjectsView notes={notes} />
    </VaultPageLayout>
  );
}
