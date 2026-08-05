import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { getPortfolioData } from "@/lib/portfolio/build-portfolio-data";
import { getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function PortfolioPage() {
  const now = new Date();
  const [data, counts] = await Promise.all([getPortfolioData(now), getSectionCounts()]);

  return (
    <VaultPageLayout
      title="Portfolio"
      description="One canonical view of every project's status, phase, next action, blockers, and repository mapping. Read-only: durable changes still go through the existing draft-PR change plan on the Overview page."
      counts={counts}
    >
      <PortfolioOverview data={data} today={now.toISOString().slice(0, 10)} />
    </VaultPageLayout>
  );
}
