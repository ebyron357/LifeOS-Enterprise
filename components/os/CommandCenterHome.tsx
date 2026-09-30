import Link from "next/link";
import type { ResumePackage } from "@/lib/continuity/model";
import type { GitHubHealthData } from "@/lib/github/health";
import type { IntegrationStatus } from "@/lib/os/integrations";
import type { HermesContract } from "@/lib/os/hermes";
import type { ProjectBrief, VaultDashboardData } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
import { ContinuityResume } from "./ContinuityResume";
import { IntegrationBadge } from "./IntegrationBadge";

type CommandCenterHomeProps = {
  greeting: string;
  dateLabel: string;
  vault: VaultDashboardData;
  integrations: IntegrationStatus[];
  hermes: HermesContract;
  github: GitHubHealthData;
  resume: ResumePackage;
};

function projectLine(project: ProjectBrief): string {
  return project.nextAction || project.blocker || project.waitingOn || "Open this project to choose the next move.";
}

const lifeLanes = [
  {
    label: "BUILD & SELL",
    title: "Digital Products",
    description: "Websites, templates, white-label systems, product launches, and marketplace listings.",
    links: [
      { label: "Website builds", href: "/projects" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Product launch stack", href: "/resources" },
    ],
  },
  {
    label: "COMMERCE",
    title: "Shopify & Brands",
    description: "Storefronts, products, packaging, content, and revenue operations.",
    links: [
      { label: "Business systems", href: "/businesses" },
      { label: "Projects", href: "/projects" },
      { label: "Automations", href: "/automations" },
    ],
  },
  {
    label: "AI WORKFORCE",
    title: "Agents & Automation",
    description: "Agent roles, delegated work, n8n workflows, approvals, and execution status.",
    links: [
      { label: "Agents", href: "/agents" },
      { label: "Automations", href: "/automations" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    label: "LEARNING & ACCESS",
    title: "Adobe · IBM · AMP",
    description: "Training, partner platforms, benefits, certifications, and capability-building.",
    links: [
      { label: "Learning", href: "/learning" },
      { label: "Resources", href: "/resources" },
      { label: "Files", href: "/files" },
    ],
  },
];

export function CommandCenterHome({ greeting, dateLabel, vault, integrations, hermes, github, resume }: CommandCenterHomeProps) {
  const mission = vault.priorities[0] ?? vault.projects[0] ?? null;
  const outcomes = vault.priorities.slice(0, 3);
  const blocked = vault.projects.filter((project) => project.status === "blocked" || project.blocker);
  const waiting = vault.projects.filter((project) => project.status === "waiting" || project.waitingOn);

  return (
    <div className="os-dashboard">
      <header className="os-hero">
        <div>
          <p className="os-kicker">{dateLabel}</p>
          <h1>{greeting}</h1>
          <p className="os-hero-copy">One screen for what matters now, what is blocked, and where every part of your life and business lives.</p>
        </div>
        <div className="os-health-strip" aria-label="System summary">
          <div><span>ACTIVE</span><strong>{vault.activeProjects}</strong></div>
          <div><span>WAITING</span><strong>{vault.waitingOn}</strong></div>
          <div><span>BLOCKED</span><strong>{blocked.length}</strong></div>
          <div><span>REVIEWS</span><strong>{vault.reviewsDue}</strong></div>
        </div>
      </header>

      <section className="os-focus-grid" aria-label="Focus now">
        <article className="os-focus-card os-focus-primary">
          <div className="os-card-topline"><span>01</span><span>PRIMARY MISSION</span></div>
          <h2>{mission ? mission.name : "Choose today's lead mission"}</h2>
          <p>{mission ? projectLine(mission) : "No active project is marked as the lead mission."}</p>
          <Link className="os-primary" href={resume.next.href || (mission ? noteHref(mission.path) : "/inbox")}>
            {resume.next.ownership === "owner" ? "Handle next action" : mission ? "Resume mission" : "Capture next move"}
          </Link>
        </article>

        <article className="os-focus-card">
          <div className="os-card-topline"><span>02</span><span>CRITICAL OUTCOMES</span></div>
          {outcomes.length ? (
            <ol className="os-outcomes">
              {outcomes.map((item) => (
                <li key={item.path}>
                  <strong>{item.name}</strong>
                  <span>{item.nextAction || "Choose the next verified action."}</span>
                </li>
              ))}
            </ol>
          ) : <p>No priority outcomes are in the vault yet.</p>}
        </article>
      </section>

      <section className="os-section">
        <div className="os-section-heading">
          <div>
            <p className="os-kicker">YOUR OPERATING LANES</p>
            <h2>Everything has a home.</h2>
          </div>
          <Link href="/more">Open all systems</Link>
        </div>

        <div className="os-lane-grid">
          {lifeLanes.map((lane, index) => (
            <article className="os-lane-card" key={lane.title}>
              <div className="os-lane-number">{String(index + 1).padStart(2, "0")}</div>
              <p className="os-kicker">{lane.label}</p>
              <h3>{lane.title}</h3>
              <p>{lane.description}</p>
              <div className="os-lane-links">
                {lane.links.map((link) => <Link key={link.href + link.label} href={link.href}>{link.label}<span>→</span></Link>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="os-section">
        <div className="os-section-heading">
          <div>
            <p className="os-kicker">CONTINUITY</p>
            <h2>Pick up exactly where you left off.</h2>
          </div>
        </div>
        <ContinuityResume resume={resume} />
      </section>

      <section className="os-three-grid">
        <article className="os-info-card">
          <div className="os-card-topline"><span>BLOCKERS</span><strong>{blocked.length}</strong></div>
          {blocked.length ? (
            <ul>{blocked.slice(0, 4).map((item) => <li key={item.path}><strong>{item.name}</strong><span>{item.blocker || "Blocked without a named reason."}</span></li>)}</ul>
          ) : <p>No blocked projects are recorded.</p>}
        </article>

        <article className="os-info-card">
          <div className="os-card-topline"><span>WAITING ON</span><strong>{waiting.length}</strong></div>
          {waiting.length ? (
            <ul>{waiting.slice(0, 4).map((item) => <li key={item.path}><strong>{item.name}</strong><span>{item.waitingOn || item.status}</span></li>)}</ul>
          ) : <p>Nothing is marked waiting.</p>}
        </article>

        <article className="os-info-card">
          <div className="os-card-topline"><span>AI CAPACITY</span><strong>{hermes.state}</strong></div>
          <p>LifeOS can inspect vault attention, GitHub health, and propose governed actions.</p>
          <Link className="os-secondary" href="/conversation">Open AI workspace</Link>
        </article>
      </section>

      <section className="os-section">
        <div className="os-section-heading">
          <div>
            <p className="os-kicker">SYSTEM HEALTH</p>
            <h2>Connections and execution signals.</h2>
          </div>
          <span className="os-github-line">GitHub: {github.connected ? `${github.openPullRequests} open PR${github.openPullRequests === 1 ? "" : "s"}` : "not verified"}</span>
        </div>
        <div className="os-integration-grid">
          {integrations.map((item) => <IntegrationBadge key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
}
