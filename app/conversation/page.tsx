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
      description="Talk or type. Share a screen only when you choose. Risky actions stay visible and approval-gated."
      counts={counts}
    >
      <AgentConversationWorkspace vault={vault} />
    </VaultPageLayout>
  );
}
