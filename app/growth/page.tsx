import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function GrowthPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("growth"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Growth" description="Areas, goals, and personal growth operating records." counts={counts}>
      <NoteList notes={notes} emptyMessage="No growth records found." />
    </VaultPageLayout>
  );
}
