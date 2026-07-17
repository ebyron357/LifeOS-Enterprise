import type { WidgetDefinition } from "@/components/widgets/registry";
import { AIStatus } from "@/components/widgets/AIStatus";
import { MorningBrief } from "@/components/widgets/MorningBrief";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import { GitHubHealth } from "@/components/widgets/GitHubHealth";
import type { GitHubHealthData } from "@/lib/github/health";

type DashboardLayoutProps = { widgets: readonly WidgetDefinition[]; data: VaultDashboardData; github: GitHubHealthData };

export function DashboardLayout({ widgets, data, github }: DashboardLayoutProps) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="dashboard-shell">
      <nav className="command-bar" aria-label="LifeOS command status">
        <div className="command-brand"><span className="brand-mark">L</span><strong>LIFEOS</strong><em>EXECUTIVE INTELLIGENCE</em></div>
        <div className="command-signals">
          <span>CORE <b>ONLINE</b></span>
          <span>VAULT <b>SYNCED</b></span>
          <span className="signal-time">{today}</span>
        </div>
      </nav>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span>01</span> Executive command center</p>
          <h1>Good morning,<br /><em>Bwa.</em></h1>
          <p className="date-line">Priority intelligence compiled from the live vault.</p>
        </div>
        <div className="system-pill" aria-label="LifeOS systems operational">
          <span aria-hidden="true" /> All systems nominal
        </div>
      </header>

      <section className="dashboard-grid" aria-label="Executive dashboard widgets">
        <div className="widget-slot widget-slot--wide" data-widget-id="morning-brief">
          <MorningBrief priorities={data.priorities} activeProjects={data.activeProjects} waitingOn={data.waitingOn} reviewsDue={data.reviewsDue} />
        </div>
        {widgets.map(({ id, Component, size }) => (
          <div className={`widget-slot widget-slot--${size}`} key={id} data-widget-id={id}>
            <Component />
          </div>
        ))}
        <div className="widget-slot widget-slot--standard" data-widget-id="github-health">
          <GitHubHealth data={github} />
        </div>
        <div className="widget-slot widget-slot--standard" data-widget-id="ai-workforce">
          <AIStatus agents={data.agents} />
        </div>
      </section>
    </main>
  );
}
