import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { NoteList } from "@/components/vault/NoteList";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function BusinessesPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("businesses"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Businesses" description="Business portfolio records and operating metadata." counts={counts}>
      <NoteList notes={notes.filter((note) => note.type === "business")} emptyMessage="No business records found." />
    </VaultPageLayout>
  );
}
