import { AppShell } from "@/components/os/AppShell";
import { IntegrationBadge } from "@/components/os/IntegrationBadge";
import { RefreshStatus } from "@/components/os/RefreshStatus";
import { getOsContext } from "@/lib/os/page-data";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const os = await getOsContext();

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>Integrations</h1>
          <p>Live labels only. Configured is not connected. Connected requires a verified probe.</p>
        </header>
        <section className="os-card">
          <h2>Hermes</h2>
          <p>{os.hermes.role}</p>
          <p>State: {os.hermes.state}. Delegated tasks recorded here: {os.hermes.delegatedTasks}.</p>
          <p>{os.hermes.limitation}</p>
          <p>{os.hermes.approvalBoundary}</p>
          <RefreshStatus label="Recheck statuses" />
        </section>
        <div className="os-grid os-grid-2">
          {os.integrations.map((item) => <IntegrationBadge key={item.id} item={item} />)}
        </div>
      </div>
    </AppShell>
  );
}
