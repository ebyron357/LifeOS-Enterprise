import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function TemplatesPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("templates"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Templates" description="Canonical and legacy templates for note creation in Obsidian." counts={counts}>
      <NoteList notes={notes} emptyMessage="No templates found." />
    </VaultPageLayout>
  );
}
