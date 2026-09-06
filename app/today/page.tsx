import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { getOsContext } from "@/lib/os/page-data";
import { noteHref } from "@/lib/vault/slug";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const os = await getOsContext();
  const mission = os.vault.priorities[0] ?? os.vault.projects[0] ?? null;
  const outcomes = os.vault.priorities.slice(0, 3);

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-grid">
        <header className="os-page-header">
          <p className="widget-eyebrow">{os.dateLabel}</p>
          <h1>Today</h1>
          <p>One mission. A few outcomes. One next action.</p>
        </header>
        <section className="os-card">
          <h2>Primary mission</h2>
          <p><strong>{mission ? mission.name : "No lead mission is marked in the vault."}</strong></p>
          {mission ? <Link className="os-primary" href={noteHref(mission.path)}>Resume this project</Link> : <Link className="os-primary" href="/inbox">Capture what matters</Link>}
        </section>
        <section className="os-card">
          <h2>Critical outcomes</h2>
          {outcomes.length ? (
            <ol>
              {outcomes.map((item) => (
                <li key={item.path}>{item.name}: {item.nextAction || "Choose the next verified action."}</li>
              ))}
            </ol>
          ) : <p>No priority outcomes are recorded yet.</p>}
        </section>
        <section className="os-card">
          <h2>Start here</h2>
          <p>{mission?.nextAction || mission?.blocker || "Ask LifeOS what needs attention, or capture the next action."}</p>
        </section>
      </div>
    </AppShell>
  );
}
