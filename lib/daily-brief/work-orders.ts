import type { TopOutcome, ProposedAgentWorkOrder } from "./types";

/**
 * Builds proposal-only agent work order cards for outcomes whose owner
 * type is "Agent Candidate" or "Shared". These are never launched; a
 * runtime agent is never started by this module or anything that calls
 * it. Every card is clearly labeled "Proposed Agent Work Order — Not
 * Running" and starts in the "Pending" human-approval state.
 */
export function buildProposedWorkOrders(outcomes: TopOutcome[]): ProposedAgentWorkOrder[] {
  return outcomes
    .filter((outcome) => outcome.ownerType === "Agent Candidate" || outcome.ownerType === "Shared")
    .map((outcome) => buildWorkOrder(outcome));
}

function buildWorkOrder(outcome: TopOutcome): ProposedAgentWorkOrder {
  return {
    workOrderId: `wo-${outcome.outcomeId}`,
    label: "Proposed Agent Work Order — Not Running",
    projectId: outcome.projectId,
    projectName: outcome.projectName,
    canonicalRepository: "",
    proposedBranch: `feat/${outcome.projectId}-daily-brief-proposal`,
    objective: outcome.desiredResult,
    relevantContext: outcome.reasonItMattersToday,
    relevantFiles: [],
    acceptanceCriteria: [outcome.desiredResult],
    testsRequired: ["Run the project's existing verification suite before requesting review."],
    prohibitedActions: [
      "No admin, billing, deployment, repository-settings, credential-management, or secret-management permissions.",
      "No merges.",
      "No production deployment.",
      "No external communication or publication.",
    ],
    evidenceRequired: outcome.evidence,
    dependencies: outcome.deadlineOrDependency ? [outcome.deadlineOrDependency] : [],
    riskLevel: outcome.priority === "Critical" ? "High" : outcome.priority === "High" ? "Medium" : "Low",
    humanApprovalState: "Pending",
    reviewOwner: "Owner",
    stopConditions: [
      "Stop and request human review if the objective becomes ambiguous.",
      "Stop if credentials, approval, or payment become required.",
      "Stop if a destructive action would be required.",
    ],
  };
}
