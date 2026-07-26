import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { SearchClient } from "@/components/search/SearchClient";
import { getSectionCounts, getVaultIndex, searchVault } from "@/lib/vault/index";

export const revalidate = 300;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    type?: string;
    folder?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [index, counts] = await Promise.all([
    getVaultIndex(),
    getSectionCounts(),
  ]);

  const query = params.q ?? "";
  const tag = params.tag ?? "";
  const type = params.type ?? "";
  const folder = params.folder ?? "";

  let results = query ? searchVault(index, query, { tag: tag || undefined, type: type || undefined }) : [];

  if (folder) {
    results = (query ? results : index.notes.map((note) => ({ note, score: 1, highlights: [] })))
      .filter((result) => result.note.folder === folder);
  }

  return (
    <VaultPageLayout title="Search" description="Search approved vault notes by title, metadata, headings, and body." counts={counts}>
      <SearchClient
        initialQuery={query}
        initialTag={tag}
        initialType={type}
        initialFolder={folder}
        results={results}
        tags={Object.keys(index.byTag).sort()}
        types={Object.keys(index.byType).sort()}
      />
    </VaultPageLayout>
  );
}
