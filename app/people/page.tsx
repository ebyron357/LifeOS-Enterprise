import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { PeopleView } from "@/components/vault/PeopleView";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function PeoplePage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("people"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="People" description="Relationship CRM records with enrichment-ready metadata." counts={counts}>
      <PeopleView notes={notes} />
    </VaultPageLayout>
  );
}
