import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { AgentConversationWorkspace } from "@/components/agent/AgentConversationWorkspace";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { getSectionCounts } from "@/lib/vault/index";

export const dynamic = "force-dynamic";

export default async function ConversationPage() {
  const [vault, counts] = await Promise.all([getVaultDashboardData(), getSectionCounts()]);

  return (
    <VaultPageLayout
      title="Conversation"
      description="Talk or type to LifeOS, share a screen when you choose, and keep every risky action visible and approval-gated. This does not replace the Command Board, Daily Brief, or draft-PR write path."
      counts={counts}
    >
      <AgentConversationWorkspace vault={vault} />
    </VaultPageLayout>
  );
}
