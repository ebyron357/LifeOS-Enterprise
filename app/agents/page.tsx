import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function AgentsPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("agents"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout
      title="Agents"
      description="AI workforce roles, agent specifications, and operating instructions."
      counts={counts}
    >
      <section className="library-panel">
        <h2>Cabinet and specialist roles</h2>
        <p className="portal-page-description">
          Agent operations follow the universal instructions in <code>AGENTS.md</code> and the read-only worker definitions under <code>docs/WEB_AGENT_OPERATIONS.md</code>.
        </p>
      </section>
      <NoteList notes={notes} emptyMessage="No agent records found." />
    </VaultPageLayout>
  );
}
