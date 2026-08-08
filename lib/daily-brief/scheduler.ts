import type { TopOutcome, StartHereAction, ProposedScheduleBlock, ConfidenceLevel } from "./types";
import type { AvailabilityWindow } from "./calendar";
import { getAvailabilityWindows, windowMinutes } from "./calendar";

export type SchedulerSettings = {
  /** Fraction (0-1) of available time reserved as buffer. Default 0.2 (20%). */
  bufferRatio: number;
  manualWindows?: AvailabilityWindow[];
};

export const DEFAULT_SCHEDULER_SETTINGS: SchedulerSettings = { bufferRatio: 0.2 };

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isSchedulable(outcome: TopOutcome): boolean {
  // Blocked work must never be scheduled. Waiting/blocked-owner status is
  // represented on the portfolio project, not the outcome type itself, so
  // callers are expected to exclude blocked/waiting projects from
  // `outcomes` before calling buildProposedSchedule. This guard is a
  // defense-in-depth backstop against a caller mistake.
  if (outcome.portfolioStatus === "Blocked" || outcome.portfolioStatus === "Waiting") return false;
  if (outcome.completed || outcome.deferred) return false;
  return true;
}

/**
 * Builds a Suggest Only proposed schedule. This function never creates,
 * modifies, or reads a real calendar event — it only produces plain data
 * blocks a human can review, edit, approve, or reject. Blocked work and
 * work missing required credentials/approval are never scheduled.
 */
export function buildProposedSchedule(
  outcomes: TopOutcome[],
  startHere: StartHereAction | null,
  settings: SchedulerSettings = DEFAULT_SCHEDULER_SETTINGS,
): ProposedScheduleBlock[] {
  const windows = getAvailabilityWindows(settings.manualWindows);
  const schedulable = outcomes.filter(isSchedulable);
  const blocks: ProposedScheduleBlock[] = [];

  // Order: Start Here's outcome first (finish/continue active work before
  // starting anything new), then remaining outcomes by priority order as
  // already sorted by the caller.
  const ordered = [...schedulable].sort((a, b) => {
    if (startHere && a.outcomeId === startHere.outcomeId) return -1;
    if (startHere && b.outcomeId === startHere.outcomeId) return 1;
    return 0;
  });

  for (const window of windows) {
    const totalMinutes = windowMinutes(window);
    const bufferMinutes = window.fixed ? 0 : Math.round(totalMinutes * settings.bufferRatio);
    const workableMinutes = Math.max(0, totalMinutes - bufferMinutes);
    let cursor = window.start;
    let remaining = workableMinutes;

    for (const outcome of ordered) {
      if (remaining <= 0) break;
      // Skip outcomes already scheduled in a previous window.
      if (blocks.some((block) => block.sourceOutcomeId === outcome.outcomeId)) continue;

      const allocated = Math.min(outcome.estimatedEffortMinutes || 60, remaining);
      const end = addMinutes(cursor, allocated);
      const isStartHere = startHere?.outcomeId === outcome.outcomeId;

      blocks.push({
        blockId: `block-${outcome.outcomeId}-${window.start}`,
        startTime: cursor,
        endTime: end,
        projectId: outcome.projectId,
        projectName: outcome.projectName,
        action: isStartHere ? startHere!.verbPhrase + " " + startHere!.object : outcome.desiredResult,
        expectedResult: outcome.desiredResult,
        sourceOutcomeId: outcome.outcomeId,
        flexibility: outcome.deadlineOrDependency ? "Fixed" : "Flexible",
        confidence: outcome.confidence,
        reasonForPlacement: isStartHere
          ? "Start Here action: begin immediately-actionable work before anything else today."
          : `Scheduled after Start Here to finish active work (${outcome.priority} priority) before opening new projects.`,
        approvalState: "Proposed",
        userEdited: false,
      });

      cursor = end;
      remaining -= allocated;
    }

    if (bufferMinutes > 0) {
      blocks.push({
        blockId: `block-buffer-${window.start}`,
        startTime: cursor,
        endTime: addMinutes(cursor, bufferMinutes),
        projectId: "",
        projectName: "",
        action: "Buffer",
        expectedResult: "Reserved capacity for interruptions, review, and overrun.",
        sourceOutcomeId: null,
        flexibility: "Buffer",
        confidence: "High" as ConfidenceLevel,
        reasonForPlacement: "At least 20% of available work time is reserved as buffer unless verified user settings override this.",
        approvalState: "Proposed",
        userEdited: false,
      });
    }
  }

  return blocks;
}
