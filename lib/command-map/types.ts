export type CommandMapEntityType =
  | "project"
  | "business"
  | "agent"
  | "blocker"
  | "person"
  | "next-action"
  | "system";

export type CommandMapNodeData = {
  entityType: CommandMapEntityType;
  label: string;
  status?: string;
  priority?: string;
  path?: string;
  description?: string;
  shape: "rect" | "diamond" | "circle" | "hex";
};

export type CommandMapEdgeData = {
  relationship: string;
  explanation: string;
};

export type CommandMapNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: CommandMapNodeData;
};

export type CommandMapEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  data: CommandMapEdgeData;
};

export type CommandMapGraph = {
  nodes: CommandMapNode[];
  edges: CommandMapEdge[];
  generatedAt: string;
  warnings: string[];
};

export type CommandMapProjectInput = {
  name: string;
  path: string;
  status: string;
  priority: string;
  business: string;
  nextAction: string;
  waitingOn: string;
  blocker: string;
  owner?: string;
};

export type CommandMapAgentInput = {
  name: string;
  status: string;
  purpose: string;
};

export type CommandMapBusinessInput = {
  name: string;
  path: string;
  status?: string;
};

export type CommandMapPersonInput = {
  name: string;
  path: string;
  organization?: string;
  role?: string;
};

export type CommandMapBuildInput = {
  projects: CommandMapProjectInput[];
  agents: CommandMapAgentInput[];
  businesses: CommandMapBusinessInput[];
  people: CommandMapPersonInput[];
  now?: Date;
};
