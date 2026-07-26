import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function SopsPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("sops"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="SOPs" description="Repeatable procedures and tested operating workflows." counts={counts}>
      <NoteList notes={notes} emptyMessage="No SOP records found." />
    </VaultPageLayout>
  );
}
