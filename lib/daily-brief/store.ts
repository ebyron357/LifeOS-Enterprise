import type {
  DailyBriefStoreState,
  DailyOperationsBrief,
  EndOfDayReview,
  ProposedScheduleBlock,
  TopOutcome,
  UserEdit,
} from "./types";
import { emptyStoreState } from "./types";

export { emptyStoreState };

function touch(brief: DailyOperationsBrief, now: string): DailyOperationsBrief {
  return { ...brief, updatedAt: now };
}

function replaceLatestRevision(
  state: DailyBriefStoreState,
  briefDate: string,
  updater: (latest: DailyOperationsBrief) => DailyOperationsBrief,
): DailyBriefStoreState {
  const revisions = state.revisionsByDate[briefDate] ?? [];
  if (revisions.length === 0) return state;
  const latest = revisions[revisions.length - 1];
  const updated = updater(latest);
  return {
    ...state,
    revisionsByDate: {
      ...state.revisionsByDate,
      [briefDate]: [...revisions.slice(0, -1), updated],
    },
  };
}

/**
 * Adds a newly generated brief as the latest revision for its date.
 * Refuses to silently replace an Approved/Active revision in place —
 * regeneration after approval must always append a new revision instead
 * (see `regenerateAfterApproval`), never mutate the approved one.
 */
export function addBriefRevision(state: DailyBriefStoreState, brief: DailyOperationsBrief): DailyBriefStoreState {
  const revisions = state.revisionsByDate[brief.briefDate] ?? [];
  const latest = revisions[revisions.length - 1];
  if (latest && (latest.state === "Approved" || latest.state === "Active" || latest.state === "Completed")) {
    throw new Error(
      `Cannot silently overwrite an approved brief for ${brief.briefDate}. Use regenerateAfterApproval to create a new revision.`,
    );
  }
  return {
    ...state,
    revisionsByDate: {
      ...state.revisionsByDate,
      [brief.briefDate]: [...revisions, brief],
    },
  };
}

/**
 * Regenerates a brief after the current latest revision has been
 * approved. The previous revision is marked "Superseded" and preserved in
 * history; the new revision starts fresh at "Draft" with an incremented
 * revision number. Full revision history is never deleted.
 */
export function regenerateAfterApproval(
  state: DailyBriefStoreState,
  briefDate: string,
  nextDraft: DailyOperationsBrief,
): DailyBriefStoreState {
  const revisions = state.revisionsByDate[briefDate] ?? [];
  const supersededRevisions = revisions.map((revision, index) =>
    index === revisions.length - 1 ? { ...revision, state: "Superseded" as const } : revision,
  );
  return {
    ...state,
    revisionsByDate: {
      ...state.revisionsByDate,
      [briefDate]: [...supersededRevisions, nextDraft],
    },
  };
}

export function approveBrief(state: DailyBriefStoreState, briefDate: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) =>
    touch({ ...latest, state: "Approved", approvedVersion: latest.revision }, now));
}

export function activateBrief(state: DailyBriefStoreState, briefDate: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({ ...latest, state: "Active" }, now));
}

export function editMission(state: DailyBriefStoreState, briefDate: string, mission: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => {
    const edit: UserEdit = { editId: `edit-${now}-mission`, timestamp: now, field: "todaysMission", before: latest.todaysMission, after: mission };
    return touch({ ...latest, todaysMission: mission, userEdits: [...latest.userEdits, edit] }, now);
  });
}

function updateOutcome(outcomes: TopOutcome[], outcomeId: string, updater: (outcome: TopOutcome) => TopOutcome): TopOutcome[] {
  return outcomes.map((outcome) => (outcome.outcomeId === outcomeId ? updater(outcome) : outcome));
}

export function editOutcome(
  state: DailyBriefStoreState,
  briefDate: string,
  outcomeId: string,
  patch: Partial<Pick<TopOutcome, "desiredResult" | "reasonItMattersToday" | "estimatedEffortMinutes">>,
  now: string,
): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => {
    const edit: UserEdit = { editId: `edit-${now}-${outcomeId}`, timestamp: now, field: `outcome:${outcomeId}`, before: JSON.stringify(latest.topOutcomes.find((o) => o.outcomeId === outcomeId)), after: JSON.stringify(patch) };
    return touch({
      ...latest,
      topOutcomes: updateOutcome(latest.topOutcomes, outcomeId, (outcome) => ({ ...outcome, ...patch })),
      userEdits: [...latest.userEdits, edit],
    }, now);
  });
}

export function reorderOutcomes(state: DailyBriefStoreState, briefDate: string, orderedOutcomeIds: string[], now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => {
    const byId = new Map(latest.topOutcomes.map((outcome) => [outcome.outcomeId, outcome]));
    const reordered = orderedOutcomeIds.map((id) => byId.get(id)).filter((outcome): outcome is TopOutcome => Boolean(outcome));
    return touch({ ...latest, topOutcomes: reordered }, now);
  });
}

export function markOutcomeComplete(state: DailyBriefStoreState, briefDate: string, outcomeId: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    topOutcomes: updateOutcome(latest.topOutcomes, outcomeId, (outcome) => ({ ...outcome, completed: true })),
  }, now));
}

export function deferOutcome(state: DailyBriefStoreState, briefDate: string, outcomeId: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    topOutcomes: updateOutcome(latest.topOutcomes, outcomeId, (outcome) => ({ ...outcome, deferred: true })),
  }, now));
}

function updateScheduleBlock(blocks: ProposedScheduleBlock[], blockId: string, updater: (block: ProposedScheduleBlock) => ProposedScheduleBlock): ProposedScheduleBlock[] {
  return blocks.map((block) => (block.blockId === blockId ? updater(block) : block));
}

export function editScheduleBlock(
  state: DailyBriefStoreState,
  briefDate: string,
  blockId: string,
  patch: Partial<Pick<ProposedScheduleBlock, "startTime" | "endTime" | "action">>,
  now: string,
): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    proposedSchedule: updateScheduleBlock(latest.proposedSchedule, blockId, (block) => ({ ...block, ...patch, userEdited: true })),
  }, now));
}

export function approveSchedule(state: DailyBriefStoreState, briefDate: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    scheduleApprovalState: "Approved",
    proposedSchedule: latest.proposedSchedule.map((block) => ({ ...block, approvalState: "Approved" as const })),
  }, now));
}

export function rejectSchedule(state: DailyBriefStoreState, briefDate: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    scheduleApprovalState: "Rejected",
    proposedSchedule: latest.proposedSchedule.map((block) => ({ ...block, approvalState: "Rejected" as const })),
  }, now));
}

export function approveWorkOrder(state: DailyBriefStoreState, briefDate: string, workOrderId: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    proposedWorkOrders: latest.proposedWorkOrders.map((order) => (order.workOrderId === workOrderId ? { ...order, humanApprovalState: "Approved" as const } : order)),
  }, now));
}

export function rejectWorkOrder(state: DailyBriefStoreState, briefDate: string, workOrderId: string, now: string): DailyBriefStoreState {
  return replaceLatestRevision(state, briefDate, (latest) => touch({
    ...latest,
    proposedWorkOrders: latest.proposedWorkOrders.map((order) => (order.workOrderId === workOrderId ? { ...order, humanApprovalState: "Rejected" as const } : order)),
  }, now));
}

export function startEndOfDayReview(state: DailyBriefStoreState, briefDate: string, review: EndOfDayReview): DailyBriefStoreState {
  return {
    ...state,
    endOfDayReviewsByDate: { ...state.endOfDayReviewsByDate, [briefDate]: review },
    revisionsByDate: replaceLatestRevision(state, briefDate, (latest) => ({
      ...latest,
      completionState: "In Progress",
      endOfDayReviewId: review.reviewId,
    })).revisionsByDate,
  };
}

export function completeEndOfDayReview(state: DailyBriefStoreState, briefDate: string, now: string): DailyBriefStoreState {
  const review = state.endOfDayReviewsByDate[briefDate];
  if (!review) return state;
  const completed: EndOfDayReview = { ...review, completedAt: now };
  return {
    ...state,
    endOfDayReviewsByDate: { ...state.endOfDayReviewsByDate, [briefDate]: completed },
    revisionsByDate: replaceLatestRevision(state, briefDate, (latest) => ({
      ...latest,
      state: "Completed",
      completionState: "Completed",
    })).revisionsByDate,
  };
}

export function getLatestRevision(state: DailyBriefStoreState, briefDate: string): DailyOperationsBrief | null {
  const revisions = state.revisionsByDate[briefDate] ?? [];
  return revisions.length ? revisions[revisions.length - 1] : null;
}

export function getAllDatesDescending(state: DailyBriefStoreState): string[] {
  return Object.keys(state.revisionsByDate).sort((a, b) => b.localeCompare(a));
}

export function getMostRecentApprovedBrief(state: DailyBriefStoreState, beforeDate?: string): DailyOperationsBrief | null {
  const dates = getAllDatesDescending(state).filter((date) => !beforeDate || date < beforeDate);
  for (const date of dates) {
    const revisions = state.revisionsByDate[date] ?? [];
    for (let i = revisions.length - 1; i >= 0; i -= 1) {
      const revision = revisions[i];
      if (revision.state === "Approved" || revision.state === "Active" || revision.state === "Completed") {
        return revision;
      }
    }
  }
  return null;
}
