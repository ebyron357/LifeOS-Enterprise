import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function JournalPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("journal"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Journal" description="Daily notes and personal logs." counts={counts}>
      <NoteList notes={notes.sort((a, b) => (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? ""))} emptyMessage="No journal entries found." />
    </VaultPageLayout>
  );
}
