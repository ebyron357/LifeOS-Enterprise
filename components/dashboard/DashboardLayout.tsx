import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { PortalSidebar } from "@/components/shell/PortalSidebar";
import { CommandCenterWorkspace } from "@/components/workspace/CommandCenterWorkspace";
import type { WidgetDefinition } from "@/components/widgets/registry";
import type { GitHubHealthData } from "@/lib/github/health";
import type { RevenueRadarData } from "@/lib/google/revenue";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import type { VaultSection } from "@/lib/vault/types";

type DashboardLayoutProps = {
  widgets: readonly WidgetDefinition[];
  data: VaultDashboardData;
  github: GitHubHealthData;
  revenue?: RevenueRadarData;
  counts?: Partial<Record<VaultSection, number>>;
};

export function DashboardLayout({ data, github, revenue, counts }: DashboardLayoutProps) {
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

      <main id="main-content" className="dashboard-shell workspace-main" tabIndex={-1}>
        <nav className="command-bar" aria-label="LifeOS command status">
          <div className="command-brand">
            <span className="brand-mark">L</span>
            <strong>LIVE INTELLIGENCE</strong>
            <em>Workspace OS V1</em>
          </div>
          <div className="command-signals">
            <span className="signal-time">Read-only vault · layout preferences stay in this browser</span>
          </div>
        </nav>

        <CommandCenterWorkspace data={data} github={github} revenue={revenue} />
      </main>
    </div>
  );
}
