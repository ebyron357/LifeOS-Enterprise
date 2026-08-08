import type { PortfolioProject } from "@/lib/portfolio/types";

/** Lifecycle states for a Daily Operations Brief. Order matters for display only. */
export type BriefState = "Draft" | "Awaiting Review" | "Approved" | "Active" | "Completed" | "Superseded";

export type OwnerType = "Human" | "Agent Candidate" | "Shared";

export type ConfidenceLevel = "High" | "Medium" | "Low";

/** One of the (at most three) top outcomes selected for the day. */
export type TopOutcome = {
  outcomeId: string;
  projectId: string;
  projectName: string;
  desiredResult: string;
  reasonItMattersToday: string;
  evidence: string[];
  portfolioStatus: PortfolioProject["status"];
  priority: PortfolioProject["priority"];
  health: PortfolioProject["health"];
  deadlineOrDependency: string;
  estimatedEffortMinutes: number;
  ownerType: OwnerType;
  confidence: ConfidenceLevel;
  sourceLinks: string[];
  completed: boolean;
  deferred: boolean;
};

/** The single next actionable step for the day. */
export type StartHereAction = {
  actionId: string;
  outcomeId: string;
  projectId: string;
  verbPhrase: string;
  object: string;
  requiredApprovalOrCredentials: string;
  startable: boolean;
};

export type ScheduleMode = "suggest-only";

export type ScheduleBlockFlexibility = "Fixed" | "Flexible" | "Buffer";

export type ProposedScheduleBlock = {
  blockId: string;
  startTime: string;
  endTime: string;
  projectId: string;
  projectName: string;
  action: string;
  expectedResult: string;
  sourceOutcomeId: string | null;
  flexibility: ScheduleBlockFlexibility;
  confidence: ConfidenceLevel;
  reasonForPlacement: string;
  approvalState: "Proposed" | "Approved" | "Rejected";
  userEdited: boolean;
};

export type AgentWorkOrderRiskLevel = "Low" | "Medium" | "High";

/** Proposal only. Never launches a runtime agent. */
export type ProposedAgentWorkOrder = {
  workOrderId: string;
  label: "Proposed Agent Work Order — Not Running";
  projectId: string;
  projectName: string;
  canonicalRepository: string;
  proposedBranch: string;
  objective: string;
  relevantContext: string;
  relevantFiles: string[];
  acceptanceCriteria: string[];
  testsRequired: string[];
  prohibitedActions: string[];
  evidenceRequired: string[];
  dependencies: string[];
  riskLevel: AgentWorkOrderRiskLevel;
  humanApprovalState: "Pending" | "Approved" | "Rejected";
  reviewOwner: string;
  stopConditions: string[];
};

export type HumanDecision = {
  decisionId: string;
  question: string;
  whyItMatters: string;
  deadline: string;
  options: string[];
  consequences: string;
  recommendedOption: string | null;
  evidence: string[];
  resolved: boolean;
};

export type BlockedOrWaitingItem = {
  itemId: string;
  projectId: string;
  projectName: string;
  kind: "Blocked" | "Waiting";
  state: string;
  blocker: string;
  waitingOn: string;
  dateFirstBlocked: string;
  followUpDate: string;
  nextFollowUpAction: string;
  workThatCanProceedMeanwhile: string;
  escalationCondition: string;
};

export type NotTodayItem = {
  itemId: string;
  projectId: string;
  projectName: string;
  excludedAction: string;
  reason: string;
  nextReviewDate: string;
  status: "Active" | "Deprioritized";
};

export type ChangeSincePreviousBrief = {
  changeId: string;
  category:
    | "completed-outcome"
    | "newly-active-project"
    | "new-blocker"
    | "resolved-blocker"
    | "changed-priority"
    | "changed-health"
    | "failed-check"
    | "merged-work"
    | "new-pull-request"
    | "agent-record-change"
    | "overdue-review"
    | "schedule-change"
    | "unfinished-work-carried-forward"
    | "new-work-discovered";
  projectId: string | null;
  description: string;
  evidence: string[];
};

export type EndOfDayReview = {
  reviewId: string;
  briefId: string;
  briefDate: string;
  completedWork: string[];
  remainingWork: string[];
  changedState: string[];
  newlyBlockedWork: string[];
  waitingWork: string[];
  decisionsMade: string[];
  completedAgentRecordWork: string[];
  workRequiringReview: string[];
  newlyDiscoveredWork: string[];
  selectedCarryForward: string[];
  excludedCarryForward: string[];
  influenceOnTomorrow: string[];
  confidence: ConfidenceLevel;
  evidence: string[];
  manualCorrections: string[];
  supersededNextActions: string[];
  createdAt: string;
  completedAt: string | null;
};

export type CalendarState = {
  connected: boolean;
  mode: "read-only" | "availability-assumed";
  reason: string;
};

export type UserEdit = {
  editId: string;
  timestamp: string;
  field: string;
  before: string;
  after: string;
};

/** The persistent Daily Operations Brief record. One revision. */
export type DailyOperationsBrief = {
  briefId: string;
  briefDate: string;
  timezone: string;
  generatedAt: string;
  state: BriefState;
  revision: number;
  todaysMission: string;
  topOutcomes: TopOutcome[];
  startHere: StartHereAction | null;
  proposedSchedule: ProposedScheduleBlock[];
  scheduleMode: ScheduleMode;
  scheduleApprovalState: "Proposed" | "Approved" | "Rejected";
  proposedWorkOrders: ProposedAgentWorkOrder[];
  humanDecisions: HumanDecision[];
  blockedItems: BlockedOrWaitingItem[];
  waitingItems: BlockedOrWaitingItem[];
  notToday: NotTodayItem[];
  changesSincePrevious: ChangeSincePreviousBrief[];
  assumptions: string[];
  confidence: ConfidenceLevel;
  evidenceReferences: string[];
  sourceSnapshotIds: string[];
  staleWarnings: string[];
  userEdits: UserEdit[];
  approvedVersion: number | null;
  completionState: "Not Started" | "In Progress" | "Completed";
  endOfDayReviewId: string | null;
  calendar: CalendarState;
  createdAt: string;
  updatedAt: string;
};

/** All revisions of every brief, keyed by briefDate, plus end-of-day reviews. */
export type DailyBriefStoreState = {
  schemaVersion: 1;
  revisionsByDate: Record<string, DailyOperationsBrief[]>;
  endOfDayReviewsByDate: Record<string, EndOfDayReview>;
};

export function emptyStoreState(): DailyBriefStoreState {
  return { schemaVersion: 1, revisionsByDate: {}, endOfDayReviewsByDate: {} };
}
