export type ProjectBrief = {
  name: string;
  status: string;
  priority: string;
  business: string;
  nextAction: string;
  reviewDate: string;
  waitingOn: string;
  blocker: string;
};

export type AgentBrief = {
  name: string;
  status: string;
  reviewDate: string;
  purpose: string;
};

export type VaultDashboardData = {
  priorities: ProjectBrief[];
  activeProjects: number;
  waitingOn: number;
  reviewsDue: number;
  agents: AgentBrief[];
};
