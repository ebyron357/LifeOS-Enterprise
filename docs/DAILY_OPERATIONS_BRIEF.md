# Daily Operations Brief and Suggest Only Scheduling

This document describes the Daily Operations Brief feature added on top of the
canonical portfolio control layer (PR #46 / `feat/canonical-portfolio-control-layer`).
It is a dependent phase — it reads the portfolio layer's data, it never
replaces or bypasses it.

## Architecture

```
app/daily-brief/page.tsx                 server component: loads portfolio
                                          data + section counts, wraps the
                                          shell layout
  └─ components/daily-brief/DailyOperationsBriefApp.tsx
       "use client" — owns brief state, wires every user control

lib/daily-brief/
  types.ts                  canonical data model + brief states
  calendar.ts                calendar-integration inspection (no integration
                              exists today → always "availability-assumed")
  scheduler.ts                Suggest Only proposed-schedule builder
  work-orders.ts              proposal-only agent work-order builder
  generate-brief.ts            pure generateDailyBrief() generation engine
  build-end-of-day-review.ts   pure buildEndOfDayReview()
  store.ts                     pure reducer functions (revision history,
                                approve/edit/defer/schedule/work-order/review)
  use-daily-brief-store.ts     browser-local persistence (localStorage)
```

The generation engine, scheduler, work-order builder, and store reducers are
all pure functions with no I/O — they are unit-tested directly
(`tests/daily-brief-*.test.ts`) without needing a browser. The UI component is
the only place that wires them to persistence and user interaction, and is
covered by Playwright (`tests/e2e/daily-brief.spec.ts`).

No file under `lib/portfolio/`, `components/portfolio/`, `app/portfolio/`,
`architecture/METADATA_SCHEMA.md`, or `PROJECT_REPO_REGISTRY.md` was modified
by this feature. No Revenue Radar or voice file was touched.

## Data model

`DailyOperationsBrief` (see `lib/daily-brief/types.ts`) carries:

- `briefId`, `briefDate`, `timezone`, `generatedAt`, `state`, `revision`
- `todaysMission` — one outcome-based sentence
- `topOutcomes` — at most 3 `TopOutcome` records (project ID/name, desired
  result, reason it matters, evidence, Portfolio Status, Priority, Health,
  deadline/dependency, estimated effort, owner type, confidence, source links,
  completed/deferred flags)
- `startHere` — at most one `StartHereAction` (verb phrase + object,
  required approval/credentials, startable flag) or `null`
- `proposedSchedule` — `ProposedScheduleBlock[]` (Suggest Only)
- `scheduleMode` (always `"suggest-only"` today), `scheduleApprovalState`
- `proposedWorkOrders` — `ProposedAgentWorkOrder[]`, proposal-only
- `humanDecisions` — `HumanDecision[]`
- `blockedItems`, `waitingItems` — `BlockedOrWaitingItem[]`
- `notToday` — `NotTodayItem[]`
- `changesSincePrevious` — `ChangeSincePreviousBrief[]`
- `assumptions: string[]`, `confidence`
- `evidenceReferences`, `sourceSnapshotIds`, `staleWarnings`
- `userEdits: UserEdit[]`, `approvedVersion`, `completionState`
- `endOfDayReviewId`, `calendar: CalendarState`
- `createdAt`, `updatedAt`

Brief states: `Draft → Awaiting Review → Approved → Active → Completed`, plus
`Superseded` for any revision that has been replaced by a newer one.

### Revision history and immutability

`lib/daily-brief/store.ts`'s `addBriefRevision` throws if the caller tries to
add a revision for a date whose latest stored revision is `Approved`,
`Active`, or `Completed` — an approved brief can never be silently
overwritten. To regenerate after approval, `regenerateAfterApproval` marks the
current revision `Superseded` and appends a new `Draft` revision, so the full
history is retained (`tests/daily-brief-store.test.ts`).

## Source precedence

The generation engine consumes canonical `PortfolioProject` records (already
normalized and sanitized by the existing portfolio layer) and, when present,
the most recent approved brief and the most recent completed end-of-day
review for that project set. Live GitHub Project 2 fields, calendar
availability, and repository/CI evidence are consumed indirectly through
whatever the portfolio sync engine has already written into those canonical
records — this phase does not perform a second, separate live GitHub/calendar
call during brief generation. Untrusted text (next actions, evidence,
blocker/waiting descriptions) is always passed through the existing
`sanitizeImportedText()` (`lib/portfolio/sanitize.ts`) before being placed in
the brief; no instruction embedded in project, repository, issue, PR, or
calendar text is ever executed.

## Planning rules (as implemented)

`generateDailyBrief()`:

- selects candidate outcomes only from projects that are `Active`, have a
  `nextAction`, and have no `blocker`/`waitingOn`
- sorts candidates by Priority (Critical > High > Medium > Low > Someday),
  then Health, then review/deadline recency
- selects at most 3 top outcomes
- carries forward unfinished outcomes from the previous brief before
  considering newly-discovered candidates
- builds exactly one Start Here action (verb + object) from the
  highest-ranked outcome when actionable work exists, or `null` when none
  does
- raises a `HumanDecision` when 3+ projects are tied at Critical priority (a
  genuine prioritization decision) or when a project's Portfolio Status is
  `Needs Review`/`Needs Audit` and would otherwise silently be excluded
- computes `blockedItems`/`waitingItems` from every project with a
  `blocker`/`waitingOn`, regardless of whether it would have ranked as a top
  outcome
- computes `notToday` from ranked-but-unselected candidates
- computes `changesSincePrevious` by diffing against `sourceSnapshotIds` from
  the prior brief, never "from memory"
- surfaces `staleWarnings` for any project whose verification/health data is
  stale or unknown

## Scheduling modes

Only **Suggest Only** exists today (`scheduleMode: "suggest-only"`).
`lib/daily-brief/scheduler.ts`'s `buildProposedSchedule()`:

- never creates or modifies a calendar event (no calendar-write API exists in
  this codebase to call)
- excludes blocked, waiting, completed, and deferred outcomes from the
  schedule entirely
- places the Start Here action first
- reserves a configurable buffer (default 20% of available work time,
  overridable via `SchedulerSettings.bufferRatio`)
- truncates or defers work that would overrun the available window
- every block records `flexibility`, `confidence`, and `reasonForPlacement`

The UI's "Approve schedule" / "Reject schedule" controls only change
`scheduleApprovalState` in local brief state; they never write to any
calendar.

## Calendar behavior

`lib/daily-brief/calendar.ts`'s `inspectCalendarIntegration()` always reports
no connected calendar integration, because none exists anywhere in this
codebase today (confirmed by inspection, not assumed). `resolveCalendarState()`
returns `{ connected: false, mode: "availability-assumed", reason: "No
authorized calendar integration is configured." }`, and
`getAvailabilityWindows()` falls back to a default 09:00–17:00 work day. The
brief still generates fully in this mode; the schedule is labeled "Suggest
Only" and the calendar gap is documented here rather than silently ignored.
Should a real, authorized, read-only calendar integration be added later, it
should populate `CalendarState` and availability windows without changing the
Suggest Only guarantees above.

## Morning workflow

1. User opens `/daily-brief`.
2. On first mount, the component reads the true persisted store directly from
   `localStorage` (bypassing any not-yet-hydrated React state — see
   "Known implementation detail" below). If today's date has no revision yet,
   `generateDailyBrief()` runs and the result is persisted as revision 1,
   state `Draft`.
3. User reviews mission, Start Here, top outcomes, schedule, decisions,
   blocked/waiting items — editing mission/outcomes, reordering, deferring,
   marking complete, or regenerating the draft as needed.
4. User clicks **Approve brief** (a confirmation dialog is required for this
   consequential action). The brief moves to `Approved`; a later
   `activateBrief` call (available for programmatic use) can move it to
   `Active`.
5. Regenerating after approval never overwrites the approved revision — it
   supersedes it and creates a new draft revision instead.

## End-of-day workflow

1. From an `Approved` or `Active` brief, the user clicks **Start end-of-day
   review**. `buildEndOfDayReview()` diffs the brief's outcomes against
   current project state to seed completed/remaining/newly-blocked/waiting
   work, decisions made, and carry-forward candidates.
2. The review is stored in `endOfDayReviewsByDate` and referenced from the
   brief via `endOfDayReviewId`.
3. **Complete end-of-day review** (confirmation required) marks the review
   completed; its carry-forward and newly-discovered-work data feed the next
   day's `generateDailyBrief()` call as `previousReview`.
4. **View previous briefs** lets the user navigate any stored date's revision
   history without losing the current day's in-progress state.

## Agent work-order proposals

Every `ProposedAgentWorkOrder` card is labeled **"Proposed Agent Work Order —
Not Running"** and starts with `humanApprovalState: "Pending"`. Approving one
only changes that local state field — nothing in this codebase launches a
runtime agent, and `prohibitedActions` on every work order explicitly lists
no-merge / no-admin / no-billing / no-deployment / no-credential-management
constraints as a durable reminder for whoever eventually acts on the proposal.

## Evidence and confidence handling

Each top outcome carries its own `evidence` and `sourceLinks`; the UI hides
this behind a **View evidence** toggle (progressive disclosure) rather than
showing it by default. `staleWarnings` and the brief's overall `confidence`
level are surfaced under an "Assumptions and confidence" disclosure so a
stale or low-confidence brief is never mistaken for a fully-verified one.

## Security boundaries

- All project-derived free text flows through `sanitizeImportedText()` before
  reaching the DOM.
- No new repository-write mechanism exists; canonical metadata changes still
  require the existing `ChangePlanPersistence` → draft-PR path.
- No calendar write, external communication, purchase, publish, merge, or
  production deploy action exists anywhere in this feature's code paths.
- Consequential actions (Approve brief, Complete end-of-day review) require
  an explicit confirmation dialog.
- Daily Brief runtime state is browser-local only; it is never sent to a
  server endpoint by this feature.

## Failure handling

- If a project's health/verification data is stale or unknown, it is
  surfaced via `staleWarnings` rather than hidden.
- If no project qualifies as a top outcome, the brief still generates with an
  honest mission statement and empty-state messaging instead of an error.
- If `localStorage` is unavailable or contains malformed JSON,
  `readStoredDailyBriefState()` falls back to an empty store rather than
  throwing, so the page still renders and a fresh brief can be generated.

## Rollback

See the "Daily Operations Brief and Suggest Only Scheduling" entry in
`docs/P0_LIFEOS_RECOVERY_RUNLOG.md` for the full rollback procedure. In
short: this entire feature is additive and isolated to `lib/daily-brief/*`,
`components/daily-brief/*`, `app/daily-brief/*`, and its own tests/tooling;
closing the dependent draft PR/branch fully reverts it, and no canonical
vault or GitHub Project 2 data is ever touched.

## Operator instructions

- Generate/refresh a brief by visiting `/daily-brief`; it auto-generates
  today's draft on first visit if one doesn't already exist.
- Use **Regenerate draft** to recompute from current portfolio data (only
  allowed while the latest revision is still a `Draft`/`Awaiting Review`, or
  it will supersede an approved one instead of touching it).
- Use **Approve brief** once you're satisfied with the day's plan.
- Use **Start end-of-day review** / **Complete end-of-day review** at the end
  of the day so tomorrow's brief accounts for what actually happened.
- Clear `localStorage.removeItem("lifeos-daily-brief-store-v1")` in your
  browser to reset all locally-stored brief/review history (this affects only
  your browser; it is not synced anywhere).

## Known limitations

1. No live calendar integration exists; every brief runs in
   "availability-assumed" mode with a default 09:00–17:00 window.
2. Brief generation reads GitHub Project 2 / repository / CI evidence only
   indirectly, through whatever the existing portfolio sync engine has
   already written into canonical project records — it does not make a
   second, separate live call to GitHub Project 2 or GitHub's REST API during
   generation.
3. Runtime state (revisions, reviews) is browser-local (`localStorage`) only;
   it is not synced across devices or persisted server-side.
4. No live Vercel preview URL could be produced or verified from the sandbox
   this change was authored in (no deployment credentials/network access to
   Vercel are available there). Screenshots captured against a local
   production build (`next build && next start`) are provided below as
   owner-preview evidence in the meantime; opening the dependent draft PR is
   expected to trigger this repository's existing Vercel GitHub integration
   (if configured) to produce a real preview URL automatically.

## Owner-preview evidence

Screenshots below were captured with Playwright against a local production
build (`next build && next start -p 4174`) with a seeded browser-local brief,
using the same fixture data as `tests/e2e/seed-brief.ts`.

- `docs/assets/daily-operations-brief/desktop-opening-view.png` — opening
  view: mission, Start Here, top outcomes, proposed schedule, work-order
  card, decisions, blocked/waiting table.
- `docs/assets/daily-operations-brief/desktop-evidence-disclosed.png` —
  evidence progressive-disclosure toggle expanded.
- `docs/assets/daily-operations-brief/mobile-opening-view.png` — Pixel 7
  mobile viewport.
