import { AppShell } from "@/components/os/AppShell";
import { CommandCenterWorkspace } from "@/components/workspace/CommandCenterWorkspace";
import type { WidgetDefinition } from "@/components/widgets/registry";
import type { GitHubHealthData } from "@/lib/github/health";
import type { RevenueRadarData } from "@/lib/google/revenue";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import { daypartGreeting } from "@/lib/os/greeting";
import type { VaultSection } from "@/lib/vault/types";

type DashboardLayoutProps = {
  widgets: readonly WidgetDefinition[];
  data: VaultDashboardData;
  github: GitHubHealthData;
  revenue?: RevenueRadarData;
  counts?: Partial<Record<VaultSection, number>>;
};

export function DashboardLayout({ data, github, revenue }: DashboardLayoutProps) {
  return (
    <AppShell greeting={daypartGreeting()}>
      <div className="dashboard-shell workspace-main">
        <nav className="command-bar" aria-label="LifeOS command status">
          <div className="command-brand">
            <span className="brand-mark">L</span>
            <strong>LIVE INTELLIGENCE</strong>
            <em>Interactive Visual V1</em>
          </div>
          <div className="command-signals">
            <span className="signal-time">Read-only vault · layout preferences stay in this browser</span>
          </div>
        </nav>

        <CommandCenterWorkspace data={data} github={github} revenue={revenue} />
      </div>
    </AppShell>
  );
}
