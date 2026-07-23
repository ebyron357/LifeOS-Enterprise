import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { ReviewsView } from "@/components/vault/ReviewsView";
import { getNotesBySection, getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function ReviewsPage() {
  const [notes, counts] = await Promise.all([
    getNotesBySection("reviews"),
    getSectionCounts(),
  ]);

  return (
    <VaultPageLayout title="Reviews" description="Daily, weekly, monthly, and operating-cycle review records." counts={counts}>
      <ReviewsView notes={notes} />
    </VaultPageLayout>
  );
}
