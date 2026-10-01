import Link from "next/link";
import type { ResumePackage } from "@/lib/continuity/model";
import type { GitHubHealthData } from "@/lib/github/health";
import type { IntegrationStatus } from "@/lib/os/integrations";
import type { HermesContract } from "@/lib/os/hermes";
import type { ProjectBrief, VaultDashboardData } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
import { ContinuityResume } from "./ContinuityResume";
import styles from "./LegendaryCommandCenter.module.css";

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

const ownerLanes = [
  { label: "ClientVerse", href: "/projects" },
  { label: "Bravo Paws", href: "/businesses" },
  { label: "Website Builds", href: "/portfolio" },
  { label: "White Label", href: "/portfolio" },
  { label: "Website Flipping", href: "/portfolio" },
  { label: "Product Hunt", href: "/resources" },
  { label: "n8n", href: "/automations" },
  { label: "Claude", href: "/agents" },
  { label: "Cursor", href: "/integrations" },
  { label: "Adobe", href: "/resources" },
  { label: "IBM", href: "/learning" },
  { label: "AMP", href: "/automations" },
  { label: "Veteran Resources", href: "/search" },
  { label: "HyperFrames", href: "/projects" },
  { label: "TikTok", href: "/growth" },
  { label: "YouTube", href: "/growth" },
  { label: "Content Systems", href: "/resources" },
  { label: "Projects / Clients", href: "/projects" },
  { label: "Finance", href: "/dashboard" },
  { label: "Real Estate", href: "/dashboards" },
  { label: "Communications", href: "/conversation" },
];

const launchers = [
  { label: "Communications", sub: "All channels", href: "/conversation", icon: "●" },
  { label: "Calendar", sub: "Your time", href: "/today", icon: "▣" },
  { label: "Tasks", sub: "Get it done", href: "/today", icon: "✓" },
  { label: "Projects", sub: "All systems", href: "/projects", icon: "▦" },
  { label: "Shopify / Brands", sub: "E-commerce", href: "/businesses", icon: "◆" },
  { label: "Websites", sub: "Build & grow", href: "/portfolio", icon: "◎" },
  { label: "AI Agents", sub: "Workforce", href: "/agents", icon: "✦" },
  { label: "Content Studio", sub: "Create & share", href: "/resources", icon: "▶" },
  { label: "Finance", sub: "Track & plan", href: "/dashboard", icon: "$" },
  { label: "Real Estate", sub: "Invest & build", href: "/dashboards", icon: "⌂" },
  { label: "Veteran Hub", sub: "Service & impact", href: "/search", icon: "◈" },
  { label: "Learning", sub: "Skills & growth", href: "/learning", icon: "▰" },
  { label: "More", sub: "All systems", href: "/more", icon: "•••" },
];

export function CommandCenterHome({ greeting, dateLabel, vault, integrations, hermes, github, resume }: CommandCenterHomeProps) {
  const mission = vault.priorities[0] ?? vault.projects[0] ?? null;
  const blocked = vault.projects.filter((project) => project.status === "blocked" || project.blocker);
  const waiting = vault.projects.filter((project) => project.status === "waiting" || project.waitingOn);
  const focus = [...vault.priorities, ...blocked, ...waiting]
    .filter((project, index, items) => items.findIndex((candidate) => candidate.path === project.path) === index)
    .slice(0, 5);
  const resumeProjects = vault.projects.slice(0, 5);
  const visibleIntegrations = integrations.slice(0, 9);
  const integrationThreads = integrations
    .filter((item) => ["github", "clickup.create_task", "slack.send_message", "vercel.deploy_production", "google-workspace"].includes(item.id))
    .slice(0, 6);
  const resumeLabel = resume.focus?.name || mission?.name || "No lead mission selected";
  const onlineCount = integrations.filter((item) => item.state === "available" || item.state === "connected").length;

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero} aria-label="LifeOS command center summary">
        <div className={styles.heroIdentity}>
          <span className={styles.heroMark}>EAB</span>
          <div>
            <h1>{greeting}</h1>
            <p>Focus. Execute. Build the life you designed.</p>
            <em>“Systems create freedom. You create the impact.”</em>
          </div>
        </div>
        <div className={styles.heroMeta}>
          <div><span>Today</span><strong>{dateLabel}</strong></div>
          <div><span>Lead mission</span><strong>{resumeLabel}</strong></div>
        </div>
      </section>

      <nav className={styles.launchStrip} aria-label="LifeOS operating lanes">
        {launchers.map((item) => (
          <Link key={item.label} className={styles.launchTile} href={item.href}>
            <span className={styles.launchIcon}>{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.sub}</small>
          </Link>
        ))}
      </nav>

      <section className={styles.ownerWorld} aria-label="My operating world">
        <div className={styles.ownerWorldTitle}>
          <span>MY OPERATING WORLD</span>
          <strong>Everything I run, build, learn, sell, and manage</strong>
        </div>
        <div className={styles.ownerLaneRow}>
          {ownerLanes.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
        </div>
      </section>

      <section className={styles.cockpit}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>◎ What Needs You Now</h2>
            <Link href="/today">View all</Link>
          </div>
          <div className={styles.focusList}>
            {focus.length ? focus.map((item, index) => (
              <Link key={item.path} className={styles.focusItem} href={noteHref(item.path)}>
                <span className={styles.focusDot} data-tone={index < 2 ? "danger" : index < 4 ? "warn" : "info"} />
                <span><strong>{item.name}</strong><small>{projectLine(item)}</small></span>
                <time>{item.status}</time>
              </Link>
            )) : <div className={styles.emptyState}>No urgent items are recorded.</div>}
          </div>
          <div className={styles.needsFooter}>
            <div><strong>{vault.activeProjects}</strong><span> active projects</span></div>
            <div><h3>Blockers</h3><strong>{blocked.length}</strong><span>{blocked.length ? " need attention" : " clear"}</span></div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div><h2>▣ Communications Hub</h2><p>All your conversations. One place. No chaos.</p></div>
            <Link href="/conversation">View all</Link>
          </div>
          <div className={styles.comms}>
            <div className={styles.threadList}>
              <div className={styles.tabs}>
                <Link href="/conversation">All</Link>
                <Link href="/conversation">Chat</Link>
                <Link href="/integrations">Email</Link>
                <Link href="/integrations">Slack</Link>
                <Link href="/integrations">Systems</Link>
              </div>
              <Link className={styles.threadSearch} href="/search">Search communications and context →</Link>
              <div className={styles.threads}>
                <Link className={styles.thread} href="/conversation">
                  <span className={styles.avatar}>A</span>
                  <span><strong>ARIA (AI Assistant)</strong><small>Command center conversation</small></span>
                  <span aria-hidden="true" />
                </Link>
                {integrationThreads.map((item) => (
                  <Link key={item.id} className={styles.thread} href="/integrations">
                    <span className={styles.avatar}>{item.service.slice(0, 2).toUpperCase()}</span>
                    <span><strong>{item.service}</strong><small>{item.state}: {item.reason}</small></span>
                    <time>{item.state}</time>
                  </Link>
                ))}
              </div>
            </div>
            <div className={styles.chat}>
              <div className={styles.chatHead}>
                <span className={styles.avatar}>A</span>
                <div><strong>ARIA</strong><small>Your AI Command Assistant</small></div>
                <span className={styles.online} data-tone={hermes.state === "unavailable" ? "warn" : "ok"}>{hermes.state === "unavailable" ? "Hermes is unavailable · LifeOS remains available" : hermes.state}</span>
              </div>
              <div className={styles.bubble}><strong>Command snapshot</strong><br />{vault.activeProjects} active projects · {blocked.length} blocked · {waiting.length} waiting · {vault.reviewsDue} reviews due.</div>
              <div className={styles.bubbleRight}>Open ARIA to ask about priorities, blockers, approvals, or the next verified move.</div>
              <Link href="/conversation" className={styles.composer}>Type a message or open voice command →</Link>
              <div className={styles.commandChips}><span>/tasks</span><span>/projects</span><span>/summarize</span><span>/create</span><span>/research</span></div>
            </div>
          </div>
        </article>

        <aside className={styles.rightRail}>
          <article className={styles.voicePanel}>
            <div className={styles.voiceHead}><h2>◉ ARIA Voice Command</h2><span>{hermes.state === "unavailable" ? "LifeOS available" : hermes.state}</span></div>
            <div className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <p>“Tell me what’s important today…”</p>
            <Link href="/conversation">Tap to speak or open voice</Link>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}><div><h2>Today</h2><p>Overview</p></div><Link href="/today">Open</Link></div>
            <div className={styles.metricGrid}>
              <div className={styles.metric}><strong>{vault.activeProjects}</strong><span>Active</span></div>
              <div className={styles.metric}><strong>{waiting.length}</strong><span>Waiting</span></div>
              <div className={styles.metric}><strong>{blocked.length}</strong><span>Blocked</span></div>
              <div className={styles.metric}><strong>{vault.reviewsDue}</strong><span>Reviews</span></div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}><h2>Upcoming</h2><Link href="/today">View Today</Link></div>
            <div className={styles.upcoming}>
              {vault.priorities.slice(0, 3).map((item) => (
                <Link key={item.path} href={noteHref(item.path)}><span>{item.name}</span><small>{projectLine(item)}</small></Link>
              ))}
              {!vault.priorities.length ? <div className={styles.emptyState}>No scheduled priority items.</div> : null}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}><h2>System Health</h2><Link href="/integrations">{onlineCount} available</Link></div>
            <div className={styles.healthGrid}>
              <span><b data-state={github.connected ? "on" : "off"} />GitHub</span>
              <span><b data-state={hermes.state === "unavailable" ? "off" : "on"} />Hermes</span>
              {visibleIntegrations.slice(0, 6).map((item) => <span key={item.id}><b data-state={item.state === "available" || item.state === "connected" ? "on" : "off"} />{item.service}</span>)}
            </div>
          </article>
        </aside>
      </section>

      <section className={styles.lowerDeck}>
        <article className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Resume Where You Left Off</h2><p>Verified continuity</p></div><Link href="/projects">View all</Link></div>
          <div className={styles.startHereLine}><h3>Start here</h3><strong>{resumeLabel}</strong><span>{resume.next.detail}</span></div>
          <div className={styles.resumeStrip}>
            {resumeProjects.map((project, index) => (
              <Link key={project.path} href={noteHref(project.path)}>
                <strong>{project.name}</strong>
                <small>{projectLine(project)}</small>
                <span>{index === 0 ? "Resume →" : "Open project →"}</span>
              </Link>
            ))}
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHead}><h2>Connected Systems</h2><Link href="/integrations">Manage</Link></div>
          <div className={styles.systemRow}>
            {visibleIntegrations.map((item) => (
              <Link key={item.id} href="/integrations"><strong>{item.service.slice(0, 2).toUpperCase()}</strong><small>{item.state}</small></Link>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.agentDeck}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div><h2>AI Agents</h2><p>Recorded workforce state</p></div>
            <Link href="/agents">Manage</Link>
          </div>
          <div className={styles.agentGrid}>
            {vault.agents.slice(0, 6).map((agent) => (
              <Link key={agent.name} href="/agents">
                <strong>{agent.name}</strong>
                <span>{agent.status || "status unavailable"}</span>
                <small>{agent.purpose || "No purpose recorded."}</small>
              </Link>
            ))}
            {!vault.agents.length ? <div className={styles.emptyState}>No agent records are currently available.</div> : null}
          </div>
        </article>
      </section>

      <section className={styles.quickPanel}>
        <div className={styles.quickTitle}>Quick Actions</div>
        <div className={styles.quickRow}>
          <Link href="/projects"><strong>▦</strong><span>New Project</span></Link>
          <Link href="/inbox"><strong>✓</strong><span>New Task</span></Link>
          <Link href="/files"><strong>⇧</strong><span>Upload File</span></Link>
          <Link href="/conversation"><strong>◉</strong><span>Record / Talk</span></Link>
          <Link href="/resources"><strong>▶</strong><span>Create Content</span></Link>
          <Link href="/agents"><strong>✦</strong><span>Launch Agent</span></Link>
          <Link href="/automations"><strong>⌘</strong><span>Run Workflow</span></Link>
          <Link href="/more"><strong>•••</strong><span>More</span></Link>
        </div>
      </section>

      <section className={styles.continuity} aria-label="Verified continuity"><ContinuityResume resume={resume} /></section>

      <footer className={styles.footer}>
        <span>{github.connected ? "GitHub connected · " + github.openPullRequests + " open PR" + (github.openPullRequests === 1 ? "" : "s") : "GitHub not verified"}</span>
        <span>Made by ClientVerse.io · LifeOS Command Center</span>
      </footer>
    </div>
  );
}
