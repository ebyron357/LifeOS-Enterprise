import type { DailyOperationsBrief, DailyBriefStoreState } from "@/lib/daily-brief/types";

const LONG_PROJECT_NAME =
  "Operationalize The Cross-Business Enterprise Knowledge Engine Consolidation And Governance Initiative For All Portfolio Companies";
const LONG_NEXT_ACTION =
  "Draft, circulate for review, incorporate feedback from every stakeholder, and finalize the comprehensive twelve-section governance and rollout plan before the next portfolio review meeting";

function outcome(overrides: Partial<DailyOperationsBrief["topOutcomes"][number]> = {}): DailyOperationsBrief["topOutcomes"][number] {
  return {
    outcomeId: "outcome-seed-1",
    projectId: "seed-project-1",
    projectName: "Seed Project",
    desiredResult: "Ship the release notes",
    reasonItMattersToday: "Marked Critical priority in the canonical portfolio.",
    evidence: ["10 Projects/Seed Project.md", "Last verified 2026-08-01"],
    portfolioStatus: "Active",
    priority: "Critical",
    health: "On Track",
    deadlineOrDependency: "2026-08-15",
    estimatedEffortMinutes: 90,
    ownerType: "Human",
    confidence: "High",
    sourceLinks: ["10 Projects/Seed Project.md"],
    completed: false,
    deferred: false,
    ...overrides,
  };
}

export function buildSeedBrief(briefDate: string, revision = 1): DailyOperationsBrief {
  const outcomes = [
    outcome(),
    outcome({
      outcomeId: "outcome-seed-2",
      projectId: "seed-project-2",
      projectName: LONG_PROJECT_NAME,
      desiredResult: LONG_NEXT_ACTION,
      ownerType: "Agent Candidate",
      priority: "High",
    }),
  ];

  return {
    briefId: `brief-${briefDate}`,
    briefDate,
    timezone: "UTC",
    generatedAt: `${briefDate}T09:00:00.000Z`,
    state: "Draft",
    revision,
    todaysMission:
      "Validate and approve today's two highest-priority outcomes so execution can begin without further portfolio review.",
    topOutcomes: outcomes,
    startHere: {
      actionId: "start-outcome-seed-1",
      outcomeId: "outcome-seed-1",
      projectId: "seed-project-1",
      verbPhrase: "Ship",
      object: "the release notes",
      requiredApprovalOrCredentials: "",
      startable: true,
    },
    proposedSchedule: [
      {
        blockId: "block-1",
        startTime: "09:00",
        endTime: "10:30",
        projectId: "seed-project-1",
        projectName: "Seed Project",
        action: "Ship the release notes",
        expectedResult: "Ship the release notes",
        sourceOutcomeId: "outcome-seed-1",
        flexibility: "Fixed",
        confidence: "High",
        reasonForPlacement: "Start Here action: begin immediately-actionable work before anything else today.",
        approvalState: "Proposed",
        userEdited: false,
      },
      {
        blockId: "block-overflow",
        startTime: "16:50",
        endTime: "17:00",
        projectId: "seed-project-2",
        projectName: LONG_PROJECT_NAME,
        action: LONG_NEXT_ACTION,
        expectedResult: LONG_NEXT_ACTION,
        sourceOutcomeId: "outcome-seed-2",
        flexibility: "Flexible",
        confidence: "Medium",
        reasonForPlacement: "Scheduled after Start Here to finish active work before opening new projects.",
        approvalState: "Proposed",
        userEdited: false,
      },
      {
        blockId: "block-buffer",
        startTime: "17:00",
        endTime: "17:30",
        projectId: "",
        projectName: "",
        action: "Buffer",
        expectedResult: "Reserved capacity for interruptions, review, and overrun.",
        sourceOutcomeId: null,
        flexibility: "Buffer",
        confidence: "High",
        reasonForPlacement: "At least 20% of available work time is reserved as buffer.",
        approvalState: "Proposed",
        userEdited: false,
      },
    ],
    scheduleMode: "suggest-only",
    scheduleApprovalState: "Proposed",
    proposedWorkOrders: [
      {
        workOrderId: "wo-outcome-seed-2",
        label: "Proposed Agent Work Order — Not Running",
        projectId: "seed-project-2",
        projectName: LONG_PROJECT_NAME,
        canonicalRepository: "",
        proposedBranch: "feat/seed-project-2-daily-brief-proposal",
        objective: LONG_NEXT_ACTION,
        relevantContext: "Marked High priority",
        relevantFiles: [],
        acceptanceCriteria: [LONG_NEXT_ACTION],
        testsRequired: ["Run the project's existing verification suite before requesting review."],
        prohibitedActions: ["No merges.", "No production deployment."],
        evidenceRequired: [],
        dependencies: [],
        riskLevel: "Medium",
        humanApprovalState: "Pending",
        reviewOwner: "Owner",
        stopConditions: ["Stop if credentials, approval, or payment become required."],
      },
    ],
    humanDecisions: [
      {
        decisionId: "decision-competing-critical",
        question: "3 projects are marked Critical priority. Which should receive today's Start Here focus?",
        whyItMatters: "Only one Start Here action can be selected.",
        deadline: "",
        options: ["Seed Project", "Second Project", "Third Project"],
        consequences: "Projects not selected move to Not Today.",
        recommendedOption: "Seed Project",
        evidence: [],
        resolved: false,
      },
    ],
    blockedItems: [
      {
        itemId: "blocked-seed-3",
        projectId: "seed-project-3",
        projectName: "Blocked Project",
        kind: "Blocked",
        state: "Blocked",
        blocker: "Waiting on legal sign-off before continuing",
        waitingOn: "",
        dateFirstBlocked: "2026-08-01",
        followUpDate: "2026-08-12",
        nextFollowUpAction: "Confirm current status with legal.",
        workThatCanProceedMeanwhile: "",
        escalationCondition: "Escalate if still blocked after 2026-08-12.",
      },
    ],
    waitingItems: [
      {
        itemId: "waiting-seed-4",
        projectId: "seed-project-4",
        projectName: "Waiting Project",
        kind: "Waiting",
        state: "Waiting",
        blocker: "",
        waitingOn: "Vendor contract signature",
        dateFirstBlocked: "2026-08-02",
        followUpDate: "2026-08-13",
        nextFollowUpAction: "Follow up with vendor.",
        workThatCanProceedMeanwhile: "",
        escalationCondition: "Escalate if no update within 7 days.",
      },
    ],
    notToday: [
      {
        itemId: "not-today-seed-5",
        projectId: "seed-project-5",
        projectName: "Deferred Project",
        excludedAction: "Define the roadmap",
        reason: "Not selected among today's top outcomes.",
        nextReviewDate: briefDate,
        status: "Active",
      },
    ],
    changesSincePrevious: [
      { changeId: "change-1", category: "changed-priority", projectId: "seed-project-1", description: "Seed Project priority changed from Medium to Critical.", evidence: [] },
    ],
    assumptions: [
      "No calendar integration is connected. Availability is assumed to be a default 09:00–17:00 work day.",
      "Effort estimates default to 90 minutes per outcome unless a project note specifies otherwise.",
    ],
    confidence: "Medium",
    evidenceReferences: ["10 Projects/Seed Project.md"],
    sourceSnapshotIds: [],
    staleWarnings: ["Blocked Project: last verified never."],
    userEdits: [],
    approvedVersion: null,
    completionState: "Not Started",
    endOfDayReviewId: null,
    calendar: { connected: false, mode: "availability-assumed", reason: "No authorized calendar integration is configured." },
    createdAt: `${briefDate}T09:00:00.000Z`,
    updatedAt: `${briefDate}T09:00:00.000Z`,
  };
}

export function buildSeedStore(dates: string[]): DailyBriefStoreState {
  const revisionsByDate: DailyBriefStoreState["revisionsByDate"] = {};
  dates.forEach((date, index) => {
    revisionsByDate[date] = [buildSeedBrief(date, index + 1)];
  });
  return { schemaVersion: 1, revisionsByDate, endOfDayReviewsByDate: {} };
}

export const SEED_LONG_PROJECT_NAME = LONG_PROJECT_NAME;
export const SEED_LONG_NEXT_ACTION = LONG_NEXT_ACTION;
