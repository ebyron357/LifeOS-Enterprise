import type { WidgetDefinition } from "@/components/widgets/registry";
import { AIStatus } from "@/components/widgets/AIStatus";
import { MorningBrief } from "@/components/widgets/MorningBrief";
import type { VaultDashboardData } from "@/lib/lifeos/types";

type DashboardLayoutProps = { widgets: readonly WidgetDefinition[]; data: VaultDashboardData };

export function DashboardLayout({ widgets, data }: DashboardLayoutProps) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Executive command center</p>
          <h1>Good morning, Byron.</h1>
          <p className="date-line">{today} · Your highest-leverage work, in one view.</p>
        </div>
        <div className="system-pill" aria-label="LifeOS systems operational">
          <span aria-hidden="true" /> Systems operational
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
        <div className="widget-slot widget-slot--standard" data-widget-id="ai-workforce">
          <AIStatus agents={data.agents} />
        </div>
      </section>
    </main>
  );
}
