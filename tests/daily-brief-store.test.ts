import { describe, expect, it } from "vitest";
import {
  addBriefRevision,
  approveBrief,
  emptyStoreState,
  getAllDatesDescending,
  getLatestRevision,
  getMostRecentApprovedBrief,
  regenerateAfterApproval,
} from "@/lib/daily-brief/store";
import { generateDailyBrief } from "@/lib/daily-brief/generate-brief";
import { portfolioProject } from "./daily-brief-fixtures";
import { isDailyBriefStoreState } from "@/lib/daily-brief/use-daily-brief-store";

const NOW = new Date("2026-08-10T09:00:00.000Z");

describe("daily brief store — revision history", () => {
  it("keeps every revision for a date instead of overwriting history", () => {
    let state = emptyStoreState();
    const brief1 = generateDailyBrief({ projects: [portfolioProject()], now: NOW });
    state = addBriefRevision(state, brief1);
    state = approveBrief(state, brief1.briefDate, NOW.toISOString());

    const brief2 = generateDailyBrief({ projects: [portfolioProject()], now: NOW, existingRevisions: state.revisionsByDate[brief1.briefDate] });
    state = regenerateAfterApproval(state, brief1.briefDate, brief2);

    expect(state.revisionsByDate[brief1.briefDate]).toHaveLength(2);
    expect(state.revisionsByDate[brief1.briefDate][0].state).toBe("Superseded");
    expect(state.revisionsByDate[brief1.briefDate][1].state).toBe("Draft");
    expect(getLatestRevision(state, brief1.briefDate)?.revision).toBe(2);
  });

  it("refuses to silently overwrite an approved brief via addBriefRevision", () => {
    let state = emptyStoreState();
    const brief1 = generateDailyBrief({ projects: [portfolioProject()], now: NOW });
    state = addBriefRevision(state, brief1);
    state = approveBrief(state, brief1.briefDate, NOW.toISOString());

    const conflicting = generateDailyBrief({ projects: [portfolioProject()], now: NOW });
    expect(() => addBriefRevision(state, conflicting)).toThrowError(/Cannot silently overwrite/);
  });

  it("lists previous brief dates for navigation, most recent first", () => {
    let state = emptyStoreState();
    const day1 = generateDailyBrief({ projects: [portfolioProject()], now: new Date("2026-08-08T09:00:00.000Z") });
    const day2 = generateDailyBrief({ projects: [portfolioProject()], now: new Date("2026-08-09T09:00:00.000Z") });
    state = addBriefRevision(state, day1);
    state = addBriefRevision(state, day2);
    expect(getAllDatesDescending(state)).toEqual([day2.briefDate, day1.briefDate]);
  });

  it("finds the most recent approved brief prior to a given date, for source precedence", () => {
    let state = emptyStoreState();
    const day1 = generateDailyBrief({ projects: [portfolioProject()], now: new Date("2026-08-08T09:00:00.000Z") });
    state = addBriefRevision(state, day1);
    state = approveBrief(state, day1.briefDate, NOW.toISOString());

    const found = getMostRecentApprovedBrief(state, "2026-08-10");
    expect(found?.briefId).toBe(day1.briefId);
  });
});

describe("daily brief store — persisted shape validation", () => {
  it("accepts the current store schema", () => {
    expect(isDailyBriefStoreState(emptyStoreState())).toBe(true);
  });

  it("rejects valid JSON with an obsolete or partial shape", () => {
    expect(isDailyBriefStoreState({ schemaVersion: 0, revisionsByDate: {}, endOfDayReviewsByDate: {} })).toBe(false);
    expect(isDailyBriefStoreState({ schemaVersion: 1, revisionsByDate: null, endOfDayReviewsByDate: {} })).toBe(false);
    expect(isDailyBriefStoreState({ schemaVersion: 1, revisionsByDate: { "2026-08-08": {} }, endOfDayReviewsByDate: {} })).toBe(false);
  });
});
