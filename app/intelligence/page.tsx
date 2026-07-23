import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function IntelligencePage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("intelligence"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Intelligence" description="Dashboards, command centers, automations, and operating intelligence notes." counts={counts}>
      <NoteList notes={notes} emptyMessage="No intelligence records found." />
    </VaultPageLayout>
  );
}
