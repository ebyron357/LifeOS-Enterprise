import Link from "next/link";
import type { ResumePackage } from "@/lib/continuity/model";
import type { GitHubHealthData } from "@/lib/github/health";
import type { IntegrationStatus } from "@/lib/os/integrations";
import type { HermesContract } from "@/lib/os/hermes";
import type { ProjectBrief, VaultDashboardData } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
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

const launchers = [
  { label: "Shopify", sub: "Store & products", href: "/businesses" },
  { label: "Websites", sub: "Build & manage", href: "/portfolio" },
  { label: "Adobe", sub: "Design & content", href: "/resources" },
  { label: "IBM", sub: "Skills & certifications", href: "/learning" },
  { label: "AMP", sub: "Automation / AI", href: "/automations" },
  { label: "YouTube / TikTok", sub: "Create & grow", href: "/growth" },
  { label: "Product Hunt", sub: "Launch & list", href: "/resources" },
  { label: "Clientverse", sub: "Agency tools", href: "/projects" },
  { label: "More", sub: "Add apps", href: "/more" },
];

export function CommandCenterHome({ greeting, dateLabel, vault, integrations, hermes, github, resume }: CommandCenterHomeProps) {
  const mission = vault.priorities[0] ?? vault.projects[0] ?? null;
  const blocked = vault.projects.filter((project) => project.status === "blocked" || project.blocker);
  const waiting = vault.projects.filter((project) => project.status === "waiting" || project.waitingOn);
  const focus = [...vault.priorities, ...blocked, ...waiting]
    .filter((project, index, items) => items.findIndex((candidate) => candidate.path === project.path) === index)
    .slice(0, 7);
  const liveProjects = vault.projects.slice(0, 5);
  const visibleIntegrations = integrations.slice(0, 8);
  const integrationThreads = integrations.filter((item) => ["github", "clickup.create_task", "slack.send_message", "vercel.deploy_production", "google-workspace"].includes(item.id));
  const resumeLabel = mission ? mission.name : "No lead mission selected";

  return (
    <div>
      <section className={styles.hero} aria-label="LifeOS command center summary">
        <div>
          <h1>{greeting}</h1>
          <p>Focus. Execute. Build the life you designed.</p>
        </div>
        <div className={styles.heroMeta}>
          <div><span>Date</span><strong>{dateLabel}</strong></div>
          <div><span>Lead mission</span><strong>{resumeLabel}</strong></div>
          <div><span>Active projects</span><strong>{vault.activeProjects}</strong></div>
          <div><span>Reviews due</span><strong>{vault.reviewsDue}</strong></div>
        </div>
      </section>

      <nav className={styles.launchStrip} aria-label="LifeOS operating lanes">
        {launchers.map((item) => (
          <Link key={item.label} className={styles.launchTile} href={item.href}>
            <strong>{item.label}</strong>
            <span>{item.sub}</span>
          </Link>
        ))}
      </nav>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>What Needs You Now</h2>
            <Link href="/today">View all</Link>
          </div>
          <div className={styles.focusList}>
            {focus.length ? focus.map((item, index) => (
              <Link
                key={item.path}
                className={styles.focusItem}
                href={noteHref(item.path)}
                style={{textDecoration:"none",color:"inherit"}}
              >
                <span className={styles.focusDot} style={{background:index < 2 ? "#ff586c" : index < 4 ? "#ffb44b" : "#37d9ff"}} />
                <span>
                  <strong>{item.name}</strong>
                  <span>{projectLine(item)}</span>
                </span>
                <span className={styles.focusTime}>{item.status}</span>
              </Link>
            )) : (
              <div className={styles.focusItem}>
                <span className={styles.focusDot} />
                <span><strong>No urgent items recorded</strong><span>Capture a next move or choose a project.</span></span>
                <span className={styles.focusTime}>clear</span>
              </div>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Communications Hub</h2>
            <Link href="/conversation">Open conversation</Link>
          </div>

          <div className={styles.comms}>
            <div className={styles.threadList}>
              <div className={styles.tabs} aria-label="Communication channels">
                <span>All</span><span>AI</span><span>Email</span><span>Slack</span><span>Tasks</span><span>Deployments</span>
              </div>
              <div className={styles.threads}>
                <Link className={styles.thread} href="/conversation" style={{textDecoration:"none",color:"inherit"}}>
                  <span className={styles.avatar}>A</span>
                  <span><strong>ARIA / Ask LifeOS</strong><span>Voice, chat, screen awareness</span></span>
                  <time>now</time>
                </Link>
                {integrationThreads.map((item) => (
                  <Link key={item.id} className={styles.thread} href="/integrations" style={{textDecoration:"none",color:"inherit"}}>
                    <span className={styles.avatar}>{item.service.slice(0,2).toUpperCase()}</span>
                    <span><strong>{item.service}</strong><span>{item.state}: {item.reason}</span></span>
                    <time>{item.state}</time>
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.chat}>
              <div className={styles.chatHead}>
                <span className={styles.avatar}>A</span>
                <div><strong>ARIA</strong><div style={{fontSize:".62rem",color:"#7f93ab"}}>Your AI command assistant</div></div>
                <span className={styles.online}>{hermes.state === "unavailable" ? "LifeOS available · Hermes unavailable" : hermes.state}</span>
              </div>

              <div className={styles.bubble}>
                <strong>Command snapshot</strong><br/>
                {vault.activeProjects} active projects · {blocked.length} blocked · {waiting.length} waiting · {vault.reviewsDue} reviews due.
              </div>
              <div className={`${styles.bubble} ${styles.bubbleRight}`}>
                Show me what needs my attention, what is blocked, and what I should resume next.
              </div>

              <Link href="/conversation" className={styles.composer} style={{textDecoration:"none"}}>
                Talk or type to LifeOS — voice, approvals, screen share, and governed actions →
              </Link>
            </div>
          </div>
        </article>

        <div className={styles.rightStack}>
          <article className={styles.panel}>
            <div className={styles.panelHead}><h2>Today&apos;s Overview</h2><Link href="/today">Open Today</Link></div>
            <div className={styles.metricGrid}>
              <div className={styles.metric}><strong>{vault.activeProjects}</strong><span>Active Projects</span></div>
              <div className={styles.metric}><strong>{vault.waitingOn}</strong><span>Waiting</span></div>
              <div className={styles.metric}><strong>{blocked.length}</strong><span>Blocked</span></div>
              <div className={styles.metric}><strong>{vault.reviewsDue}</strong><span>Reviews Due</span></div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}><h2>Live Projects</h2><Link href="/projects">View all</Link></div>
            <div className={styles.projectList}>
              {liveProjects.map((project, index) => {
                const widths = [88,72,63,48,35];
                return (
                  <Link key={project.path} className={styles.project} href={noteHref(project.path)} style={{textDecoration:"none",color:"inherit"}}>
                    <span className={styles.projectDot} style={{background: project.blocker ? "#ff586c" : project.waitingOn ? "#ffb44b" : "#36e39a"}} />
                    <strong>{project.name}</strong>
                    <span className={styles.bar}><i style={{width:`${widths[index] ?? 40}%`}} /></span>
                  </Link>
                );
              })}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}><h2>Resume Where You Left Off</h2><Link href="/projects">All work</Link></div>
            <div style={{padding:12}}>
              <strong style={{display:"block",fontSize:".8rem"}}>{resumeLabel}</strong>
              <p style={{margin:"6px 0 12px",fontSize:".68rem",color:"#7f93ab"}}>
                {mission ? projectLine(mission) : "Use Projects or Today to select the next verified action."}
              </p>
              <Link href={mission ? noteHref(mission.path) : "/projects"} style={{fontSize:".7rem",fontWeight:800,color:"#49a9ff"}}>Resume work →</Link>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}><h2>AI Agents</h2><Link href="/agents">Manage agents</Link></div>
          <div className={styles.agentRow}>
            <Link className={styles.agentCard} href="/conversation"><strong>ARIA</strong><span>Command assistant</span></Link>
            <Link className={styles.agentCard} href="/agents"><strong>Content</strong><span>Creative lane</span></Link>
            <Link className={styles.agentCard} href="/agents"><strong>Research</strong><span>Intelligence lane</span></Link>
            <Link className={styles.agentCard} href="/automations"><strong>Automation</strong><span>Workflow lane</span></Link>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}><h2>Key Systems</h2><Link href="/integrations">Manage</Link></div>
          <div className={styles.systemRow}>
            {visibleIntegrations.map((item) => (
              <Link key={item.id} className={styles.systemCard} href="/integrations">
                <strong>{item.service}</strong>
                <span>{item.state}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}><h2>Quick Actions</h2><Link href="/more">Customize</Link></div>
          <div className={styles.quickRow}>
            <Link className={styles.quickCard} href="/projects"><strong>New Project</strong><span>Open workspace</span></Link>
            <Link className={styles.quickCard} href="/inbox"><strong>New Task</strong><span>Capture action</span></Link>
            <Link className={styles.quickCard} href="/files"><strong>Upload / Files</strong><span>Open vault</span></Link>
            <Link className={styles.quickCard} href="/conversation"><strong>Record / Talk</strong><span>Open voice</span></Link>
            <Link className={styles.quickCard} href="/resources"><strong>Create Content</strong><span>Open resources</span></Link>
            <Link className={styles.quickCard} href="/portfolio"><strong>Launch Website</strong><span>Portfolio lane</span></Link>
            <Link className={styles.quickCard} href="/automations"><strong>Run Workflow</strong><span>Automation lane</span></Link>
            <Link className={styles.quickCard} href="/more"><strong>More</strong><span>All systems</span></Link>
          </div>
        </article>
      </section>

      <footer style={{marginTop:10,padding:"12px 4px",display:"flex",justifyContent:"space-between",gap:12,color:"#6f849b",fontSize:".65rem"}}>
        <span>GitHub {github.connected ? `connected · ${github.openPullRequests} open PR${github.openPullRequests === 1 ? "" : "s"}` : "not verified"}</span>
        <span>Made by ClientVerse.io · LifeOS command center</span>
      </footer>
    </div>
  );
}
