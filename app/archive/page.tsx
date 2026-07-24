import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function ArchivePage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("archive"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Archive" description="Completed, paused, and archived vault records." counts={counts}>
      <NoteList notes={notes} emptyMessage="No archived records found." />
    </VaultPageLayout>
  );
}
