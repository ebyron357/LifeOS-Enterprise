import Link from "next/link";
import type { GitHubHealthData } from "@/lib/github/health";
import type { IntegrationStatus } from "@/lib/os/integrations";
import type { HermesContract } from "@/lib/os/hermes";
import type { ProjectBrief, VaultDashboardData } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
import { IntegrationBadge } from "./IntegrationBadge";

type CommandCenterHomeProps = {
  greeting: string;
  dateLabel: string;
  vault: VaultDashboardData;
  integrations: IntegrationStatus[];
  hermes: HermesContract;
  github: GitHubHealthData;
};

function projectLine(project: ProjectBrief): string {
  return project.nextAction || project.blocker || project.waitingOn || "Open this project to choose the next move.";
}

export function CommandCenterHome({ greeting, dateLabel, vault, integrations, hermes, github }: CommandCenterHomeProps) {
  const mission = vault.priorities[0] ?? vault.projects[0] ?? null;
  const outcomes = vault.priorities.slice(0, 3);
  const blocked = vault.projects.filter((project) => project.status === "blocked" || project.blocker);
  const waiting = vault.projects.filter((project) => project.status === "waiting" || project.waitingOn);
  const resume = mission;

  return (
    <div className="os-grid">
      <header className="os-page-header">
        <p className="widget-eyebrow">{dateLabel}</p>
        <h1>{greeting}</h1>
        <p>Here is what needs you. Do not hunt. Start with one action.</p>
      </header>

      <section className="os-card" aria-labelledby="today-heading">
        <h2 id="today-heading">Today</h2>
        <p className="widget-eyebrow">Primary mission</p>
        <p><strong>{mission ? mission.name : "No active project is marked as the lead mission."}</strong></p>
        <p className="widget-eyebrow">Critical outcomes</p>
        {outcomes.length ? (
          <ol>
            {outcomes.map((item) => <li key={item.path}>{item.name}: {item.nextAction || "Choose the next verified action."}</li>)}
          </ol>
        ) : <p>No priority outcomes are in the vault yet.</p>}
      </section>

      <div className="os-grid os-grid-2">
        <section className="os-card" aria-labelledby="start-heading">
          <h2 id="start-heading">Start here</h2>
          <p>{mission ? projectLine(mission) : "Capture what is on your mind, or ask LifeOS what needs attention."}</p>
          {mission ? (
            <Link className="os-primary" href={noteHref(mission.path)}>Resume {mission.name}</Link>
          ) : (
            <Link className="os-primary" href="/inbox">Capture something</Link>
          )}
        </section>

        <section className="os-card" aria-labelledby="continue-heading">
          <h2 id="continue-heading">Continue working</h2>
          <p>{resume ? `${resume.name} · ${resume.status}` : "No recent project to resume."}</p>
          <Link className="os-secondary" href="/conversation">Ask LifeOS what to resume</Link>
        </section>
      </div>

      <div className="os-grid os-grid-2">
        <section className="os-card" aria-labelledby="blockers-heading">
          <h2 id="blockers-heading">Blockers</h2>
          {blocked.length ? (
            <ul>
              {blocked.slice(0, 5).map((item) => (
                <li key={item.path}><strong>{item.name}</strong> — {item.blocker || "Blocked without a named reason."}</li>
              ))}
            </ul>
          ) : <p>No blocked projects are recorded.</p>}
        </section>
        <section className="os-card" aria-labelledby="waiting-heading">
          <h2 id="waiting-heading">Waiting on</h2>
          {waiting.length ? (
            <ul>
              {waiting.slice(0, 5).map((item) => (
                <li key={item.path}><strong>{item.name}</strong> — {item.waitingOn || item.status}</li>
              ))}
            </ul>
          ) : <p>Nothing is marked waiting.</p>}
        </section>
      </div>

      <section className="os-card" aria-labelledby="health-heading">
        <h2 id="health-heading">Project health</h2>
        <p>Active {vault.activeProjects}. Waiting {vault.waitingOn}. Reviews due {vault.reviewsDue}. Blocked {blocked.length}.</p>
        <Link className="os-secondary" href="/projects">Open projects</Link>
      </section>

      <section className="os-card" aria-labelledby="changed-heading">
        <h2 id="changed-heading">What changed</h2>
        <p>GitHub last verified: {github.updatedAt || "unavailable"}. Open PRs: {github.connected ? github.openPullRequests : "not verified"}.</p>
        <p>Reviews due in the vault: {vault.reviewsDue}. Slack, ClickUp, and agent runs are not invented here.</p>
        <Link className="os-secondary" href="/integrations">Inspect integration health</Link>
      </section>

      <section className="os-card" aria-labelledby="agent-heading">
        <h2 id="agent-heading">What AI can handle</h2>
        <p>Ask LifeOS can read vault attention, inspect GitHub health, and propose writes. Hermes is {hermes.state}. Nothing writes without your approval and the owner write secret.</p>
        <p>{hermes.limitation}</p>
        <Link className="os-secondary" href="/conversation">Ask or approve in conversation</Link>
      </section>

      <section aria-labelledby="integrations-heading">
        <h2 id="integrations-heading">Integration health</h2>
        <div className="os-grid os-grid-2">
          {integrations.map((item) => <IntegrationBadge key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
}
