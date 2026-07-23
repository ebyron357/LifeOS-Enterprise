import type { WidgetDefinition } from "@/components/widgets/registry";
import { AIStatus } from "@/components/widgets/AIStatus";
import { MorningBrief } from "@/components/widgets/MorningBrief";
import { PersonalGrowthWidget } from "@/components/widgets/PersonalGrowthWidget";
import { InteractiveCommandCenter } from "@/components/dashboard/InteractiveCommandCenter";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { PortalSidebar } from "@/components/shell/PortalSidebar";
import { CognitiveSupportCenter } from "@/components/dashboard/CognitiveSupportCenter";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import { GitHubHealth } from "@/components/widgets/GitHubHealth";
import type { GitHubHealthData } from "@/lib/github/health";
import type { RevenueRadarData } from "@/lib/google/revenue";
import { RevenueRadar } from "@/components/widgets/RevenueRadar";
import type { VaultSection } from "@/lib/vault/types";

type DashboardLayoutProps = {
  widgets: readonly WidgetDefinition[];
  data: VaultDashboardData;
  github: GitHubHealthData;
  revenue?: RevenueRadarData;
  counts?: Partial<Record<VaultSection, number>>;
};

export function DashboardLayout({ widgets, data, github, revenue, counts }: DashboardLayoutProps) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).format(new Date());
  const blocked = data.projects.filter((project) => project.status === "blocked" || project.blocker).length;

  return (
    <div className="lifeos-app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <PortalSidebar
        counts={counts}
        dashboardActions={(
          <DashboardQuickActions
            projects={data.projects}
            activeProjects={data.activeProjects}
            reviewsDue={data.reviewsDue}
          />
        )}
      />

      <main id="main-content" className="dashboard-shell" tabIndex={-1}>
        <section id="overview" className="app-section">
          <nav className="command-bar" aria-label="LifeOS command status">
            <div className="command-brand"><span className="brand-mark">L</span><strong>LIVE INTELLIGENCE</strong><em>Verified vault signals</em></div>
            <div className="command-signals"><span className="signal-time">{today}</span></div>
          </nav>

          <header className="dashboard-header dashboard-header--calm">
            <div>
              <p className="eyebrow"><span>01</span> Today</p>
              <h1>Good day, <em>Bwa.</em></h1>
              <p className="date-line">Start with one clear action. Everything else stays safely recorded.</p>
            </div>
            <div className="system-pill" aria-label="LifeOS data loaded"><span aria-hidden="true" /> Live vault data</div>
          </header>

          <div className="mission-strip" aria-label="Current operating status">
            <article><span>Active work</span><strong>{data.activeProjects}</strong><small>projects moving</small></article>
            <article className={blocked ? "has-alert" : ""}><span>Blocked</span><strong>{blocked}</strong><small>need intervention</small></article>
            <article><span>Waiting</span><strong>{data.waitingOn}</strong><small>outside response</small></article>
            <article className={data.reviewsDue ? "has-alert" : ""}><span>Reviews due</span><strong>{data.reviewsDue}</strong><small>records need truth</small></article>
          </div>

          <CognitiveSupportCenter projects={data.projects} />
        </section>

        <section id="projects" className="app-section">
          <div className="section-heading"><span>02</span><div><p>Execution control</p><h2>Projects and decisions</h2></div></div>
          <InteractiveCommandCenter projects={data.projects} />
          <div className="widget-slot widget-slot--wide" data-widget-id="morning-brief">
            <MorningBrief priorities={data.priorities} activeProjects={data.activeProjects} waitingOn={data.waitingOn} reviewsDue={data.reviewsDue} />
          </div>
        </section>

        <section id="growth" className="app-section">
          <div className="section-heading"><span>03</span><div><p>Personal operating system</p><h2>Growth without overload</h2></div></div>
          <div className="widget-slot widget-slot--wide" data-widget-id="personal-growth">
            <PersonalGrowthWidget growth={data.growth} />
          </div>
        </section>

        <section id="intelligence" className="app-section">
          <div className="section-heading"><span>04</span><div><p>Connected signals</p><h2>Business intelligence</h2></div></div>
          <div className="dashboard-grid">
            {widgets.map(({ id, Component, size }) => (
              <div className={`widget-slot widget-slot--${size}`} key={id} data-widget-id={id}>
                {id === "revenue-radar" ? <RevenueRadar data={revenue} /> : <Component />}
              </div>
            ))}
            <div className="widget-slot widget-slot--standard" data-widget-id="github-health">
              <GitHubHealth data={github} />
            </div>
          </div>
        </section>

        <section id="agents" className="app-section">
          <div className="section-heading"><span>05</span><div><p>Accountable automation</p><h2>AI workforce</h2></div></div>
          <div className="widget-slot widget-slot--wide" data-widget-id="ai-workforce">
            <AIStatus agents={data.agents} />
          </div>
        </section>
      </main>
    </div>
  );
}
