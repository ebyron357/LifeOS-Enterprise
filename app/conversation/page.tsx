import { AgentConversationWorkspace } from "@/components/agent/AgentConversationWorkspace";
import { AppShell } from "@/components/os/AppShell";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { daypartGreeting } from "@/lib/os/greeting";

export const dynamic = "force-dynamic";

export default async function ConversationPage() {
  const vault = await getVaultDashboardData();

  return (
    <AppShell greeting={daypartGreeting()}>
      <header
        aria-label="Conversation workspace"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          margin: "0 0 8px",
          padding: "0 2px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: ".72rem",
            lineHeight: 1.2,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#7890a8",
          }}
        >
          Conversation
        </h1>
        <p style={{ margin: 0, fontSize: ".64rem", color: "#6f849b" }}>
          Owner-controlled communications · approval-gated actions
        </p>
      </header>
      <AgentConversationWorkspace vault={vault} />
    </AppShell>
  );
}
