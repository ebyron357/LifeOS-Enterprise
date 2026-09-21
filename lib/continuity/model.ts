export type ResumeOwnership = "owner" | "agent" | "shared";
export type ResumeAuthority = "always-allowed" | "review-required" | "owner-only" | "forbidden";
export type ResumeItemKind = "project" | "resource" | "github" | "integration" | "checkpoint" | "prompt";

export type ResumePromptLink = {
  id: string;
  title: string;
  version: string;
  path: string;
  href: string;
  status: string;
  current: boolean;
  supersededBy: string | null;
  lastResultStatus: string;
  warning: string | null;
  reason: string;
};

export type ResumeItem = {
  id: string;
  kind: ResumeItemKind;
  title: string;
  detail: string;
  owner: string;
  ownership: ResumeOwnership;
  authority: ResumeAuthority;
  href?: string;
  evidence: string[];
  reason: string;
};

export type ResumeFocus = {
  name: string;
  path: string;
  href: string;
  status: string;
  priority: string;
};

export type ResumePackage = {
  generatedAt: string;
  whereWasI: string;
  whatWasIDoing: string;
  why: string;
  desiredOutcome: string;
  happenedSince: string[];
  changed: string[];
  failed: string[];
  blocked: ResumeItem[];
  needsOwner: ResumeItem[];
  agentCanContinue: ResumeItem[];
  next: {
    label: string;
    href: string;
    ownership: ResumeOwnership;
    detail: string;
  };
  doNotRepeat: string[];
  unverified: string[];
  focus: ResumeFocus | null;
  source: "derived" | "checkpoint+derived";
  relevantPrompts: ResumePromptLink[];
};

export type ContinuityProjectInput = {
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
  outcome?: string;
  assignedAgent?: string;
  lastVerified?: string;
  canonicalRepo?: string;
};

export type ContinuityResourceInput = {
  name: string;
  path: string;
  sourceType: string;
  processingState: string;
  disposition: string;
  architectureClassification: string;
  nextAction: string;
  owner: string;
  lastCaptured: string;
};

export type ContinuityCheckpointInput = {
  path: string;
  title: string;
  capturedAt: string;
  project: string;
  lastCompleted: string;
  currentState: string;
  nextAction: string;
  owner: string;
  sourceOfTruth: string;
  blocker: string;
  doNotRepeat: string[];
  evidence: string[];
  sessionStatus: "OPEN" | "CLOSED";
};

export type ContinuityGitHubInput = {
  connected: boolean;
  openPullRequests: number;
  failedWorkflows: number;
  defaultBranch: string;
  lastWorkflow: string;
  updatedAt: string;
};

export type ContinuityHermesInput = {
  state: "unavailable" | "configured" | "error";
  limitation: string;
};

export type ContinuityPromptInput = {
  id: string;
  title: string;
  version: string;
  path: string;
  status: string;
  current: boolean;
  supersededBy: string | null;
  lastResultStatus: string;
  lastFailure: string | null;
  project: string | null;
  client: string | null;
  business?: string | null;
  agent?: string | null;
  taskTypes: string[];
  triggerContext: string[];
  tags: string[];
  purpose: string;
  recommendedContext: string | null;
};

export type ContinuityInput = {
  nowIso: string;
  projects: ContinuityProjectInput[];
  resources?: ContinuityResourceInput[];
  checkpoints?: ContinuityCheckpointInput[];
  prompts?: ContinuityPromptInput[];
  github: ContinuityGitHubInput;
  hermes?: ContinuityHermesInput;
};
