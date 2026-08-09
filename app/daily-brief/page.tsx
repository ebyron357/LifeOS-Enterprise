import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { DailyOperationsBriefApp } from "@/components/daily-brief/DailyOperationsBriefApp";
import { getPortfolioData } from "@/lib/portfolio/build-portfolio-data";
import { getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function DailyOperationsBriefPage() {
  const now = new Date();
  const timezone = process.env.LIFEOS_TIMEZONE?.trim() || "America/New_York";
  const [data, counts] = await Promise.all([getPortfolioData(now), getSectionCounts()]);

  return (
    <VaultPageLayout
      title="Daily Operations Brief"
      description="One Today's Mission, up to three top outcomes, one Start Here action, a Suggest Only proposed schedule, and the genuine decisions that need you. Nothing here creates or edits a calendar event, launches an agent, or writes to a project note directly."
      counts={counts}
    >
      <DailyOperationsBriefApp projects={data.projects} generatedAtIso={now.toISOString()} timezone={timezone} />
    </VaultPageLayout>
  );
}
