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
  /** Canonical `kpi_focus` frontmatter, when the business note records one. */
  kpiFocus?: string;
};

export type PersonBrief = {
  name: string;
  path: string;
  organization: string;
  role: string;
};

/** Minimal brief of an active `type: area` note. Used to derive honest, canonical side quests. */
export type AreaBrief = {
  name: string;
  path: string;
  status: string;
  tags: string[];
  /** Frontmatter `standard`, when present. */
  standard: string;
  /** First sentence of the `## Purpose` section, when present. */
  purpose: string;
  reviewDate: string;
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
  /** Active area notes. Optional so older fixtures and callers remain valid. */
  areas?: AreaBrief[];
  growth: GrowthBrief;
};
