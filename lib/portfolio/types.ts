export type PortfolioStatus =
  | "Inbox"
  | "Needs Review"
  | "Needs Audit"
  | "Planned"
  | "Ready"
  | "Active"
  | "Waiting"
  | "Blocked"
  | "Review"
  | "Completed"
  | "Archived";

export type PortfolioPriority = "Critical" | "High" | "Medium" | "Low" | "Someday";

export type PortfolioHealth = "On Track" | "At Risk" | "Blocked" | "Unknown";

export type ProjectType =
  | "Business"
  | "Product"
  | "Client"
  | "Internal System"
  | "Website"
  | "Content"
  | "Administrative"
  | "Personal"
  | "Other";

export type RepositoryClassification =
  | "Canonical"
  | "Reference"
  | "Duplicate Review"
  | "Template"
  | "Experiment"
  | "Archive Candidate"
  | "Archived"
  | "Unknown";

export type SyncStatus = "Not Synced" | "Synced" | "Conflict" | "Sync Error";

/**
 * Normalized, computed model. Never written back into a project note's
 * frontmatter automatically. Derived from the existing note model
 * (lib/vault) plus the repository registry (lib/portfolio/registry.ts).
 */
export type PortfolioProject = {
  projectId: string;
  name: string;
  outcome: string;
  projectType: ProjectType;
  status: PortfolioStatus;
  legacyStatus: string;
  priority: PortfolioPriority;
  legacyPriority: string;
  health: PortfolioHealth;
  phase: string;
  nextAction: string;
  blocker: string;
  waitingOn: string;
  dueDate: string;
  reviewDate: string;
  lastVerified: string;
  humanOwner: string;
  assignedAgentRecord: string;
  canonicalRepository: string;
  referenceRepositories: string[];
  githubProjectItemId: string;
  evidence: string[];
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  sourcePath: string;
};

export type RegistryEntry = {
  project: string;
  activeRepo: string;
  status: string;
  reason: string;
  archiveRepos: string[];
  sourceSection: "packaging" | "other-active" | "do-not-use";
};

export type RepositoryEvidence = {
  fullName: string;
  exists: boolean;
  isArchived: boolean;
  isPrivate: boolean | null;
  description: string;
  pushedAt: string | null;
  createdAt: string | null;
  openIssueCount: number | null;
  openPullRequestCount: number | null;
  latestWorkflowConclusion: string | null;
  readmeExcerpt: string;
  fetchError: string | null;
};

export type RepositoryMappingProposal = {
  project: string;
  currentMapping: string;
  proposedMapping: string;
  classification: RepositoryClassification;
  evidence: string[];
  confidence: "High" | "Medium" | "Low";
  reason: string;
  humanReviewRequired: boolean;
};

export type SyncConflict = {
  projectId: string;
  field: string;
  currentValue: string;
  proposedValue: string;
  source: "vault" | "github-project";
  evidence: string;
  confidence: "High" | "Medium" | "Low";
  timestamp: string;
  recommendedResolution: string;
};

export type SyncLogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  projectId?: string;
  detail?: Record<string, unknown>;
};

export type SyncOutcome = {
  dryRun: boolean;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkippedUnchanged: number;
  conflicts: SyncConflict[];
  fieldsReused: string[];
  fieldsMissing: string[];
  errors: string[];
  log: SyncLogEntry[];
};
