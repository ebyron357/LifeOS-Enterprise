import { describe, expect, it } from "vitest";
import { generateDailyBrief } from "@/lib/daily-brief/generate-brief";
import { buildEndOfDayReview } from "@/lib/daily-brief/build-end-of-day-review";
import { deferOutcome, addBriefRevision, completeEndOfDayReview, emptyStoreState, startEndOfDayReview } from "@/lib/daily-brief/store";
import { portfolioProject } from "./daily-brief-fixtures";

const NOW = new Date("2026-08-10T09:00:00.000Z");

describe("end-of-day review — carry forward and exclusion", () => {
  it("carries forward an unfinished outcome and excludes a deferred one", () => {
    const projects = [
      portfolioProject({ projectId: "unfinished", name: "Unfinished", status: "Active" }),
      portfolioProject({ projectId: "deferred", name: "Deferred", status: "Active" }),
    ];
    const brief = generateDailyBrief({ projects, now: NOW });
    let state = emptyStoreState();
    state = addBriefRevision(state, brief);
    state = deferOutcome(state, brief.briefDate, brief.topOutcomes.find((o) => o.projectId === "deferred")!.outcomeId, NOW.toISOString());

    const latest = state.revisionsByDate[brief.briefDate][0];
    const review = buildEndOfDayReview(latest, projects, NOW);
    expect(review.selectedCarryForward).toContain("Unfinished");
    expect(review.excludedCarryForward).toContain("Deferred");
  });

  it("reports newly blocked work discovered during the day", () => {
    const projects = [portfolioProject({ projectId: "will-block", name: "Will Block", status: "Active" })];
    const brief = generateDailyBrief({ projects, now: NOW });
    const laterProjects = [portfolioProject({ projectId: "will-block", name: "Will Block", status: "Blocked" })];
    const review = buildEndOfDayReview(brief, laterProjects, NOW);
    expect(review.newlyBlockedWork).toContain("Will Block");
  });

  it("completing a review sets completedAt and marks the brief Completed", () => {
    const brief = generateDailyBrief({ projects: [portfolioProject()], now: NOW });
    let state = emptyStoreState();
    state = addBriefRevision(state, brief);
    const review = buildEndOfDayReview(brief, [portfolioProject()], NOW);
    state = startEndOfDayReview(state, brief.briefDate, review);
    state = completeEndOfDayReview(state, brief.briefDate, NOW.toISOString());

    expect(state.endOfDayReviewsByDate[brief.briefDate].completedAt).toBe(NOW.toISOString());
    expect(state.revisionsByDate[brief.briefDate][0].state).toBe("Completed");
  });
});
