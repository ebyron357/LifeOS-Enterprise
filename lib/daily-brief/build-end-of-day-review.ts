import type { PortfolioProject } from "@/lib/portfolio/types";
import type { DailyOperationsBrief, EndOfDayReview } from "./types";

/**
 * Builds a draft end-of-day review by comparing the day's approved brief
 * against the current project state. The human can add manual
 * corrections before completing it; completion is a separate, explicit
 * action (see store.ts `completeEndOfDayReview`).
 */
export function buildEndOfDayReview(brief: DailyOperationsBrief, projects: PortfolioProject[], now: Date): EndOfDayReview {
  const byId = new Map(projects.map((project) => [project.projectId, project]));
  const completedWork: string[] = [];
  const remainingWork: string[] = [];
  const changedState: string[] = [];
  const newlyBlockedWork: string[] = [];
  const waitingWork: string[] = [];

  for (const outcome of brief.topOutcomes) {
    const current = byId.get(outcome.projectId);
    if (outcome.completed || current?.status === "Completed") {
      completedWork.push(outcome.projectName);
    } else {
      remainingWork.push(outcome.projectName);
    }
    if (current && current.status !== outcome.portfolioStatus) {
      changedState.push(`${outcome.projectName}: ${outcome.portfolioStatus} → ${current.status}`);
    }
    if (current?.status === "Blocked") newlyBlockedWork.push(outcome.projectName);
    if (current?.status === "Waiting") waitingWork.push(outcome.projectName);
  }

  const decisionsMade = brief.humanDecisions.filter((decision) => decision.resolved).map((decision) => decision.question);
  const completedAgentRecordWork = brief.proposedWorkOrders
    .filter((order) => order.humanApprovalState === "Approved")
    .map((order) => order.objective);

  const carryForward = brief.topOutcomes.filter((outcome) => !outcome.completed && !outcome.deferred).map((outcome) => outcome.projectName);
  const excludedCarryForward = brief.topOutcomes.filter((outcome) => outcome.deferred).map((outcome) => outcome.projectName);

  return {
    reviewId: `review-${brief.briefDate}`,
    briefId: brief.briefId,
    briefDate: brief.briefDate,
    completedWork,
    remainingWork,
    changedState,
    newlyBlockedWork,
    waitingWork,
    decisionsMade,
    completedAgentRecordWork,
    workRequiringReview: brief.humanDecisions.filter((decision) => !decision.resolved).map((decision) => decision.question),
    newlyDiscoveredWork: [],
    selectedCarryForward: carryForward,
    excludedCarryForward,
    influenceOnTomorrow: [
      ...(newlyBlockedWork.length ? [`${newlyBlockedWork.length} outcome(s) became blocked today and should not be scheduled tomorrow.`] : []),
      ...(carryForward.length ? [`${carryForward.length} unfinished outcome(s) should be prioritized for carry-forward tomorrow.`] : []),
    ],
    confidence: brief.confidence,
    evidence: brief.evidenceReferences,
    manualCorrections: [],
    supersededNextActions: [],
    createdAt: now.toISOString(),
    completedAt: null,
  };
}
