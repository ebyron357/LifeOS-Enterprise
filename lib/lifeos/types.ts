export type ProjectBrief = {
  name: string;
  path: string;
  status: string;
  priority: string;
  business: string;
  nextAction: string;
  reviewDate: string;
  waitingOn: string;
  blocker: string;
  owner?: string;
};

export type AgentBrief = {
  name: string;
  status: string;
  reviewDate: string;
  purpose: string;
};

export type BusinessBrief = {
  name: string;
  path: string;
  status: string;
};

export type PersonBrief = {
  name: string;
  path: string;
  organization: string;
  role: string;
};

export type GrowthBrief = {
  focus: string;
  currentValue: string;
  targetValue: string;
  reviewDate: string;
};

export type VaultDashboardData = {
  priorities: ProjectBrief[];
  projects: ProjectBrief[];
  activeProjects: number;
  waitingOn: number;
  reviewsDue: number;
  agents: AgentBrief[];
  businesses: BusinessBrief[];
  people: PersonBrief[];
  growth: GrowthBrief;
};
