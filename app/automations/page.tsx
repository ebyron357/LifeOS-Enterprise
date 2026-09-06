import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { IntegrationBadge } from "@/components/os/IntegrationBadge";
import { RefreshStatus } from "@/components/os/RefreshStatus";
import { getOsContext } from "@/lib/os/page-data";
import { sanitizeTemplatePreview } from "@/lib/os/templates";
import { getVaultIndex } from "@/lib/vault/index";
import { noteHref } from "@/lib/vault/slug";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const [os, index] = await Promise.all([getOsContext(), getVaultIndex()]);
  const n8n = os.integrations.find((item) => item.id === "n8n.trigger_workflow");
  const vercel = os.integrations.find((item) => item.id === "vercel.deploy_production");
  const notes = index.notes.filter((note) => /automation/i.test(note.folder) || /automation/i.test(note.path));

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>Automations</h1>
          <p>n8n remains the automation engine. LifeOS reports status. It does not rebuild n8n.</p>
        </header>
        {n8n ? <IntegrationBadge item={n8n} /> : null}
        {vercel ? <IntegrationBadge item={vercel} /> : null}
        <section className="os-card">
          <h2>What this page will not invent</h2>
          <p>Workflow names, last executions, and failures appear only after a live n8n probe exists. Today the adapter reports configured or unavailable from environment checks.</p>
          <p>Approved triggers still go through conversation and the owner write secret.</p>
          <RefreshStatus />
        </section>
        <section className="os-card">
          <h2>Related notes</h2>
          {notes.length ? (
            <ul>
              {notes.slice(0, 12).map((note) => (
                <li key={note.path}><Link href={noteHref(note.path)}>{sanitizeTemplatePreview(note.title)}</Link></li>
              ))}
            </ul>
          ) : <p>No automation notes are indexed yet.</p>}
        </section>
      </div>
    </AppShell>
  );
}
