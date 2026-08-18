import { sanitizeImportedText } from "@/lib/portfolio/sanitize";
import { isStale } from "@/lib/portfolio/model";
import type { PortfolioProject } from "@/lib/portfolio/types";
import type {
  BlockedOrWaitingItem,
  ChangeSincePreviousBrief,
  ConfidenceLevel,
  DailyOperationsBrief,
  EndOfDayReview,
  HumanDecision,
  NotTodayItem,
  StartHereAction,
  TopOutcome,
} from "./types";
import { resolveCalendarState } from "./calendar";
import { dateKeyInTimezone } from "./date";
import { buildProposedSchedule, DEFAULT_SCHEDULER_SETTINGS, type SchedulerSettings } from "./scheduler";
import { buildProposedWorkOrders } from "./work-orders";

const PRIORITY_RANK: Record<PortfolioProject["priority"], number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Someday: 4 };
const HEALTH_RANK: Record<PortfolioProject["health"], number> = { "At Risk": 0, Blocked: 0, "On Track": 1, Unknown: 2 };
const DEFAULT_EFFORT_MINUTES = 90;

export type GenerateBriefInput = {
  projects: PortfolioProject[];
  now?: Date;
  timezone?: string;
  previousBrief?: DailyOperationsBrief | null;
  previousReview?: EndOfDayReview | null;
  schedulerSettings?: SchedulerSettings;
  /** Existing revisions for the same date, to compute the next revision number. */
  existingRevisions?: DailyOperationsBrief[];
};

function evidenceFor(project: PortfolioProject): string[] {
  const raw = [
    project.sourcePath ? `${project.sourcePath}` : "",
    project.lastVerified ? `Last verified ${project.lastVerified}` : "",
    ...project.evidence,
  ].filter(Boolean);
  return raw.map((item) => sanitizeImportedText(item).text);
}

function ownerTypeFor(project: PortfolioProject): TopOutcome["ownerType"] {
  if (project.assignedAgentRecord) return "Agent Candidate";
  if (project.canonicalRepository) return "Shared";
  return "Human";
}

function confidenceFor(project: PortfolioProject, today: string): ConfidenceLevel {
  if (project.health === "Unknown" || isStale(project, today)) return "Low";
  if (!project.nextAction) return "Low";
  if (project.health === "At Risk") return "Medium";
  return "High";
}

function reasonItMatters(project: PortfolioProject): string {
  if (project.dueDate) return `Has a deadline or dependency on ${project.dueDate}.`;
  if (project.priority === "Critical") return "Marked Critical priority in the canonical portfolio.";
  if (project.health === "At Risk") return "Health is At Risk and needs attention to stay on track.";
  return "Highest-ranked actionable project without a blocker or open decision.";
}

function isCandidateForOutcome(project: PortfolioProject): boolean {
  return project.status === "Active" && Boolean(project.nextAction) && !project.blocker && !project.waitingOn;
}

function buildOutcomeId(project: PortfolioProject): string {
  return `outcome-${project.projectId}`;
}

function toTopOutcome(project: PortfolioProject, today: string): TopOutcome {
  return {
    outcomeId: buildOutcomeId(project),
    projectId: project.projectId,
    projectName: project.name,
    desiredResult: sanitizeImportedText(project.nextAction || project.outcome || "Define the next action.").text,
    reasonItMattersToday: reasonItMatters(project),
    evidence: evidenceFor(project),
    portfolioStatus: project.status,
    priority: project.priority,
    health: project.health,
    deadlineOrDependency: project.dueDate || "",
    estimatedEffortMinutes: DEFAULT_EFFORT_MINUTES,
    ownerType: ownerTypeFor(project),
    confidence: confidenceFor(project, today),
    sourceLinks: project.sourcePath ? [project.sourcePath] : [],
    completed: false,
    deferred: false,
  };
}

/** Splits "Ship the release notes" into verb="Ship" object="the release notes". */
function splitVerbObject(nextAction: string): { verb: string; object: string } {
  const trimmed = nextAction.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return { verb: trimmed || "Review", object: "" };
  return { verb: trimmed.slice(0, firstSpace), object: trimmed.slice(firstSpace + 1) };
}

function toStartHere(outcome: TopOutcome | undefined): StartHereAction | null {
  if (!outcome) return null;
  if (outcome.portfolioStatus === "Blocked" || outcome.portfolioStatus === "Waiting") return null;
  const { verb, object } = splitVerbObject(outcome.desiredResult);
  if (!object) return null;
  return {
    actionId: `start-${outcome.outcomeId}`,
    outcomeId: outcome.outcomeId,
    projectId: outcome.projectId,
    verbPhrase: verb,
    object,
    requiredApprovalOrCredentials: "",
    startable: true,
  };
}

function toBlockedOrWaiting(project: PortfolioProject): BlockedOrWaitingItem {
  const kind = project.status === "Blocked" ? "Blocked" : "Waiting";
  return {
    itemId: `${kind.toLowerCase()}-${project.projectId}`,
    projectId: project.projectId,
    projectName: project.name,
    kind,
    state: project.status,
    blocker: sanitizeImportedText(project.blocker).text,
    waitingOn: sanitizeImportedText(project.waitingOn).text,
    dateFirstBlocked: project.updatedAt || "",
    followUpDate: project.reviewDate || "",
    nextFollowUpAction: project.nextAction || "Confirm current status with the owner or dependency.",
    workThatCanProceedMeanwhile: "",
    escalationCondition: project.reviewDate ? `Escalate if still ${kind.toLowerCase()} after ${project.reviewDate}.` : "Escalate if no update within 7 days.",
  };
}

function toNotToday(project: PortfolioProject, reviewDate: string): NotTodayItem {
  return {
    itemId: `not-today-${project.projectId}`,
    projectId: project.projectId,
    projectName: project.name,
    excludedAction: project.nextAction || "No next action recorded.",
    reason: "Not selected among today's three top outcomes; deliberately deferred to avoid opening additional work in progress.",
    nextReviewDate: reviewDate,
    status: project.status === "Active" ? "Active" : "Deprioritized",
  };
}

function projectSnapshotId(project: PortfolioProject): string {
  return [project.projectId, project.status, project.priority, project.health, project.blocker, project.waitingOn].join(":");
}

function computeChangesSincePrevious(
  projects: PortfolioProject[],
  previousBrief: DailyOperationsBrief | null | undefined,
): ChangeSincePreviousBrief[] {
  const changes: ChangeSincePreviousBrief[] = [];
  if (!previousBrief) {
    changes.push({
      changeId: "change-no-previous",
      category: "new-work-discovered",
      projectId: null,
      description: "No previous brief was found. This is the first generated brief for this vault, so nothing could be diffed.",
      evidence: [],
    });
    return changes;
  }

  const previousSnapshotByProject = new Map<string, string>();
  for (const entry of previousBrief.sourceSnapshotIds) {
    const [projectId] = entry.split(":");
    previousSnapshotByProject.set(projectId, entry);
  }

  for (const project of projects) {
    const previous = previousSnapshotByProject.get(project.projectId);
    if (!previous) {
      changes.push({
        changeId: `change-new-${project.projectId}`,
        category: "newly-active-project",
        projectId: project.projectId,
        description: `${project.name} was not present in the previous brief's source snapshot.`,
        evidence: [project.sourcePath],
      });
      continue;
    }
    const [, prevStatus, prevPriority, prevHealth, prevBlocker, prevWaiting] = previous.split(":");
    if (prevStatus !== project.status) {
      if (prevStatus === "Blocked" && project.status !== "Blocked") {
        changes.push({ changeId: `change-unblocked-${project.projectId}`, category: "resolved-blocker", projectId: project.projectId, description: `${project.name} is no longer blocked (was ${prevStatus}, now ${project.status}).`, evidence: [] });
      } else if (project.status === "Blocked") {
        changes.push({ changeId: `change-blocked-${project.projectId}`, category: "new-blocker", projectId: project.projectId, description: `${project.name} became blocked (was ${prevStatus}).`, evidence: [project.blocker] });
      } else if (project.status === "Completed" && prevStatus !== "Completed") {
        changes.push({ changeId: `change-complete-${project.projectId}`, category: "completed-outcome", projectId: project.projectId, description: `${project.name} moved to Completed.`, evidence: [] });
      }
    }
    if (prevPriority !== project.priority) {
      changes.push({ changeId: `change-priority-${project.projectId}`, category: "changed-priority", projectId: project.projectId, description: `${project.name} priority changed from ${prevPriority} to ${project.priority}.`, evidence: [] });
    }
    if (prevHealth !== project.health) {
      changes.push({ changeId: `change-health-${project.projectId}`, category: "changed-health", projectId: project.projectId, description: `${project.name} health changed from ${prevHealth} to ${project.health}.`, evidence: [] });
    }
    if (prevBlocker !== project.blocker && project.blocker) {
      changes.push({ changeId: `change-blocker-text-${project.projectId}`, category: "new-blocker", projectId: project.projectId, description: `${project.name} blocker description changed.`, evidence: [sanitizeImportedText(project.blocker).text] });
    }
    void prevWaiting;
  }

  // Unfinished outcomes carried forward from the previous brief.
  for (const outcome of previousBrief.topOutcomes) {
    if (!outcome.completed && !outcome.deferred) {
      changes.push({
        changeId: `change-carry-${outcome.outcomeId}`,
        category: "unfinished-work-carried-forward",
        projectId: outcome.projectId,
        description: `${outcome.projectName} was not marked complete in the previous brief and may carry forward.`,
        evidence: [],
      });
    }
  }

  return changes;
}

function buildHumanDecisions(projects: PortfolioProject[], candidates: PortfolioProject[]): HumanDecision[] {
  const decisions: HumanDecision[] = [];
  const criticalCandidates = candidates.filter((project) => project.priority === "Critical");

  if (criticalCandidates.length >= 2) {
    decisions.push({
      decisionId: "decision-competing-critical",
      question: `${criticalCandidates.length} projects are marked Critical priority. Which should receive today's Start Here focus?`,
      whyItMatters: "Only one Start Here action and at most three top outcomes can be selected; prioritization among competing Critical work requires human judgment.",
      deadline: "",
      options: criticalCandidates.map((project) => project.name),
      consequences: "Projects not selected today remain Critical priority but move to Not Today, deferred at least one day.",
      recommendedOption: criticalCandidates[0]?.name ?? null,
      evidence: criticalCandidates.map((project) => project.sourcePath),
      resolved: false,
    });
  }

  const needsReview = projects.filter((project) => project.status === "Needs Review" || project.status === "Needs Audit");
  for (const project of needsReview) {
    decisions.push({
      decisionId: `decision-review-${project.projectId}`,
      question: `${project.name} requires review before it can be scheduled. Approve it for active work?`,
      whyItMatters: "Portfolio Status is Needs Review/Needs Audit, which requires explicit human approval before this system will select it as an outcome.",
      deadline: project.reviewDate || "",
      options: ["Approve for active work", "Keep in review", "Archive"],
      consequences: "Approving moves it into consideration for a future brief's top outcomes; keeping it in review excludes it from scheduling.",
      recommendedOption: null,
      evidence: [project.sourcePath],
      resolved: false,
    });
  }

  return decisions;
}

function buildAssumptions(calendarConnected: boolean, staleWarnings: string[]): string[] {
  const assumptions: string[] = [];
  assumptions.push(
    calendarConnected
      ? "Availability reflects the connected calendar's read-only free/busy data."
      : "No calendar integration is connected. Availability is assumed to be a default 09:00–17:00 work day; edit the schedule if this does not match today.",
  );
  if (staleWarnings.length) {
    assumptions.push(`${staleWarnings.length} project(s) have stale or missing "last verified" evidence; treat those outcomes with lower confidence.`);
  }
  assumptions.push("Effort estimates default to 90 minutes per outcome unless a project note specifies otherwise.");
  return assumptions;
}

function overallConfidence(outcomes: TopOutcome[]): ConfidenceLevel {
  if (outcomes.length === 0) return "Low";
  if (outcomes.some((outcome) => outcome.confidence === "Low")) return "Low";
  if (outcomes.every((outcome) => outcome.confidence === "High")) return "High";
  return "Medium";
}

function buildMission(outcomes: TopOutcome[], startHere: StartHereAction | null): string {
  if (outcomes.length === 0) {
    return "Review the portfolio for newly actionable work; no project currently qualifies as an unblocked top outcome.";
  }
  if (!startHere) {
    return `Resolve the decisions and blockers standing between today's ${outcomes.length} selected outcome(s) and actionable work.`;
  }
  const names = outcomes.map((outcome) => outcome.projectName).join(", ");
  return `Validate and approve today's ${outcomes.length === 1 ? "one highest-priority outcome" : `${outcomes.length} highest-priority outcomes`} (${names}) so execution can begin without further portfolio review.`;
}

/**
 * Generates a new Draft-state Daily Operations Brief from canonical
 * portfolio data. Pure function (besides reading `now`): no filesystem or
 * network access, fully unit-testable. Regeneration always produces a new
 * revision; callers are responsible for never overwriting an Approved
 * brief's prior revision (see store.ts).
 */
export function generateDailyBrief(input: GenerateBriefInput): DailyOperationsBrief {
  const now = input.now ?? new Date();
  const timezone = input.timezone ?? "America/New_York";
  const today = dateKeyInTimezone(now, timezone);
  const generatedAt = now.toISOString();

  const candidates = input.projects
    .filter(isCandidateForOutcome)
    .sort((a, b) => {
      const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      const healthDiff = HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
      if (healthDiff !== 0) return healthDiff;
      return (a.reviewDate || "9999").localeCompare(b.reviewDate || "9999");
    });

  const carryForwardIds = new Set(
    (input.previousBrief?.topOutcomes ?? [])
      .filter((outcome) => !outcome.completed && !outcome.deferred)
      .map((outcome) => outcome.projectId),
  );

  const ordered = [
    ...candidates.filter((project) => carryForwardIds.has(project.projectId)),
    ...candidates.filter((project) => !carryForwardIds.has(project.projectId)),
  ];

  const topOutcomes = ordered.slice(0, 3).map((project) => toTopOutcome(project, today));
  const startHere = toStartHere(topOutcomes[0]);

  const calendar = resolveCalendarState();
  const proposedSchedule = buildProposedSchedule(topOutcomes, startHere, input.schedulerSettings ?? DEFAULT_SCHEDULER_SETTINGS);
  const proposedWorkOrders = buildProposedWorkOrders(topOutcomes);

  const blockedItems = input.projects.filter((project) => project.status === "Blocked").map(toBlockedOrWaiting);
  const waitingItems = input.projects.filter((project) => project.status === "Waiting").map(toBlockedOrWaiting);
  const selectedIds = new Set(topOutcomes.map((outcome) => outcome.projectId));
  const notToday = input.projects
    .filter((project) => isCandidateForOutcome(project) && !selectedIds.has(project.projectId))
    .map((project) => toNotToday(project, today));

  const staleWarnings = input.projects
    .filter((project) => isStale(project, today))
    .map((project) => `${project.name}: last verified ${project.lastVerified || "never"}.`);

  const changesSincePrevious = computeChangesSincePrevious(input.projects, input.previousBrief);
  const humanDecisions = buildHumanDecisions(input.projects, candidates);
  const assumptions = buildAssumptions(calendar.connected, staleWarnings);
  const confidence = overallConfidence(topOutcomes);
  const sourceSnapshotIds = input.projects.map(projectSnapshotId);
  const evidenceReferences = [...new Set(topOutcomes.flatMap((outcome) => outcome.evidence))];

  const revisionNumber = (input.existingRevisions?.length ?? 0) + 1;
  const briefId = `brief-${today}`;

  return {
    briefId,
    briefDate: today,
    timezone,
    generatedAt,
    state: "Draft",
    revision: revisionNumber,
    todaysMission: buildMission(topOutcomes, startHere),
    topOutcomes,
    startHere,
    proposedSchedule,
    scheduleMode: "suggest-only",
    scheduleApprovalState: "Proposed",
    proposedWorkOrders,
    humanDecisions,
    blockedItems,
    waitingItems,
    notToday,
    changesSincePrevious,
    assumptions,
    confidence,
    evidenceReferences,
    sourceSnapshotIds,
    staleWarnings,
    userEdits: [],
    approvedVersion: null,
    completionState: "Not Started",
    endOfDayReviewId: null,
    calendar,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}
