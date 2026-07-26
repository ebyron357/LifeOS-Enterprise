import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { LibraryBrowser } from "@/components/vault/LibraryBrowser";
import { getVaultIndex, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function ResourcesPage() {
  const [index, counts] = await Promise.all([
    getVaultIndex(),
    getSectionCounts(),
  ]);

  const resourceNotes = index.bySection.resources ?? [];
  const folders = Object.keys(index.byFolder).sort();
  const tags = Object.keys(index.byTag).sort();
  const types = Object.keys(index.byType).sort();

  return (
    <VaultPageLayout
      title="Resources"
      description="Browse the full LifeOS library by folder, tag, type, and recency."
      counts={counts}
    >
      <LibraryBrowser notes={resourceNotes.length ? resourceNotes : index.notes} folders={folders} tags={tags} types={types} />
    </VaultPageLayout>
  );
}
