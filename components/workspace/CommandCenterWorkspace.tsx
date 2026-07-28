"use client";

import { useRouter } from "next/navigation";
import { ChangePlanPersistence } from "@/components/dashboard/ChangePlanPersistence";
import { CognitiveSupportCenter } from "@/components/dashboard/CognitiveSupportCenter";
import { InteractiveCommandCenter } from "@/components/dashboard/InteractiveCommandCenter";
import { AIStatus } from "@/components/widgets/AIStatus";
import { GitHubHealth } from "@/components/widgets/GitHubHealth";
import { MorningBrief } from "@/components/widgets/MorningBrief";
import { PersonalGrowthWidget } from "@/components/widgets/PersonalGrowthWidget";
import { PrayerWidget } from "@/components/widgets/PrayerWidget";
import { RevenueRadar } from "@/components/widgets/RevenueRadar";
import type { GitHubHealthData } from "@/lib/github/health";
import type { RevenueRadarData } from "@/lib/google/revenue";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
import { DecisionQueue } from "./DecisionQueue";
import { MissionStatus } from "./MissionStatus";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { WorkspaceProvider } from "./WorkspaceProvider";
import { WorkspaceShell } from "./WorkspaceShell";
import { WorkspaceWidget } from "./WorkspaceWidget";

type CommandCenterWorkspaceProps = {
  data: VaultDashboardData;
  github: GitHubHealthData;
  revenue?: RevenueRadarData;
};

export function CommandCenterWorkspace({ data, github, revenue }: CommandCenterWorkspaceProps) {
  const router = useRouter();
  const blocked = data.projects.filter((project) => project.status === "blocked" || project.blocker).length;
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const widgets = [
    {
      id: "mission-status" as const,
      node: (
        <WorkspaceWidget id="mission-status" status={blocked || data.reviewsDue ? "warning" : "success"}>
          <MissionStatus
            activeProjects={data.activeProjects}
            blocked={blocked}
            waitingOn={data.waitingOn}
            reviewsDue={data.reviewsDue}
          />
        </WorkspaceWidget>
      ),
    },
    {
      id: "cognitive-support" as const,
      node: (
        <WorkspaceWidget id="cognitive-support" status="active">
          <CognitiveSupportCenter projects={data.projects} />
        </WorkspaceWidget>
      ),
    },
    {
      id: "project-command-board" as const,
      node: (
        <WorkspaceWidget
          id="project-command-board"
          status="active"
          detailsLabel="Open projects"
          onOpenDetails={() => router.push("/projects")}
        >
          <InteractiveCommandCenter projects={data.projects} />
          <ChangePlanPersistence />
        </WorkspaceWidget>
      ),
    },
    {
      id: "decision-queue" as const,
      node: (
        <WorkspaceWidget
          id="decision-queue"
          status={data.priorities.length ? "active" : "idle"}
          detailsLabel="Open top priority"
          onOpenDetails={() => {
            const top = data.priorities[0];
            if (top) router.push(noteHref(top.path));
          }}
        >
          <DecisionQueue priorities={data.priorities} projects={data.projects} />
        </WorkspaceWidget>
      ),
    },
    {
      id: "morning-brief" as const,
      node: (
        <WorkspaceWidget id="morning-brief" status="active">
          <MorningBrief
            priorities={data.priorities}
            activeProjects={data.activeProjects}
            waitingOn={data.waitingOn}
            reviewsDue={data.reviewsDue}
          />
        </WorkspaceWidget>
      ),
    },
    {
      id: "personal-growth" as const,
      node: (
        <WorkspaceWidget id="personal-growth" status="active">
          <PersonalGrowthWidget growth={data.growth} />
        </WorkspaceWidget>
      ),
    },
    {
      id: "github-health" as const,
      node: (
        <WorkspaceWidget
          id="github-health"
          status={github.connected ? (github.failedWorkflows ? "warning" : "success") : "warning"}
        >
          <GitHubHealth data={github} />
        </WorkspaceWidget>
      ),
    },
    {
      id: "revenue-radar" as const,
      node: (
        <WorkspaceWidget
          id="revenue-radar"
          status={revenue?.connected ? "success" : "idle"}
        >
          <RevenueRadar data={revenue} />
        </WorkspaceWidget>
      ),
    },
    {
      id: "prayer" as const,
      node: (
        <WorkspaceWidget id="prayer" status="idle">
          <PrayerWidget />
        </WorkspaceWidget>
      ),
    },
    {
      id: "ai-workforce" as const,
      node: (
        <WorkspaceWidget
          id="ai-workforce"
          status={data.agents.some((agent) => agent.status === "active") ? "active" : "idle"}
          detailsLabel="Open agents"
          onOpenDetails={() => router.push("/agents")}
        >
          <AIStatus agents={data.agents} />
        </WorkspaceWidget>
      ),
    },
  ];

  return (
    <WorkspaceProvider>
      <WorkspaceShell
        title="Command Center"
        eyebrow="Workspace OS · Command Center"
        description={`Live vault-backed mission control for ${today}. Drag, resize, focus, and restore widgets without changing Markdown.`}
      >
        <div className="workspace-hero">
          <div>
            <p className="eyebrow"><span>01</span> Today</p>
            <h2>Good day, <em>Bwa.</em></h2>
            <p className="date-line">Start with one clear action. Everything else stays safely recorded.</p>
          </div>
          <div className="system-pill" aria-label="LifeOS data loaded">
            <span aria-hidden="true" /> Live vault data
          </div>
        </div>
        <WorkspaceGrid widgets={widgets} />
      </WorkspaceShell>
    </WorkspaceProvider>
  );
}
