import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function LearningPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("learning"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Learning" description="Learning queue, topics, and mastery records." counts={counts}>
      <NoteList notes={notes} emptyMessage="No learning records found yet." />
    </VaultPageLayout>
  );
}
