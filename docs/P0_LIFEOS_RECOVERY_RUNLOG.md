# P0 Life OS Recovery / Implementation Run Log

This file tracks implementation runs against Life OS that touch shared infrastructure (write paths, GitHub Project sync, schema). It exists so any run can be rolled back without guesswork.

## Entry: Canonical Portfolio Control Layer

- **Date**: 2026-08-04
- **Branch**: `feat/canonical-portfolio-control-layer`
- **Base**: `main` @ `3df9516` (post PR #45, "enable browser voice by default")
- **Scope**: Portfolio inventory, repository mapping, status/blocker/next-action visibility, and an idempotent GitHub Project 2 sync engine. No scheduling, no calendar integration, no autonomous agents, no direct-to-`main` writes, no changes to Revenue Radar or voice behavior.

### What changed

| Area | Files | Nature of change |
|---|---|---|
| Schema | `architecture/METADATA_SCHEMA.md` | Additive-only "Portfolio Extension" section: new optional frontmatter fields and controlled-value tables. No existing field, required-property list, or controlled value was removed or renamed. |
| Domain model | `lib/portfolio/types.ts`, `lib/portfolio/model.ts` | New, pure, unit-tested normalization from `VaultNote` → `PortfolioProject`. Reads frontmatter only; never writes to a note. |
| Registry | `lib/portfolio/registry.ts` | Pure markdown-table parser for `PROJECT_REPO_REGISTRY.md`. Read-only; the registry file itself is untouched by this change. |
| Repository evidence | `lib/portfolio/repository-evidence.ts` | Injectable-client evidence gathering (`repo`-scoped GitHub REST reads only: repo metadata, issues, PRs, Actions runs, README) and classification logic producing `RepositoryMappingProposal` records. No `project` OAuth scope required. |
| Sanitization | `lib/portfolio/sanitize.ts` | Neutralizes prompt-injection-shaped text before it is ever stored as "evidence." Repository content is always treated as untrusted display data. |
| GitHub Project sync | `lib/portfolio/github-project-sync.ts`, `lib/portfolio/github-project-client.ts` | Idempotent, dry-run-first sync engine against GitHub Projects v2 (field reuse detection, conflict detection against a last-synced snapshot, bounded retry with rate-limit handling, resumable per-item error handling). The real GraphQL adapter requires the `project` OAuth scope, which is **not currently granted** — see Unavoidable Manual Steps below. |
| UI | `app/portfolio/page.tsx`, `components/portfolio/PortfolioOverview.tsx`, `components/portfolio/PortfolioOverview.module.css` | New, read-only "Portfolio" page extending the existing vault portal (added to `components/shell/PortalSidebar.tsx` nav). No new write form. Any durable change still goes through the existing `ChangePlanPersistence` → `/api/lifeos/change-plan` draft-PR path. |
| Docs | `docs/PORTFOLIO_REPOSITORY_MAPPING_PROPOSAL.md`, this file | Registry validation evidence and rollback/manual-step record. |
| Scripts | `scripts/portfolio/generate-repository-mapping-proposal.ts`, `scripts/portfolio/sync-github-project.ts` | CLI entry points (via `tsx`) that call the same library code, so the sync engine and evidence gatherer are runnable outside of Next.js request handling. Both default to dry-run / read-only. |
| Tests | `tests/portfolio-*.test.ts` | New Vitest suites covering the 20 required scenarios via mocked GitHub data (see `docs/VAULT_REPAIR_REPORT.md`-style acceptance notes in the PR description for the full mapping of test file → scenario). |

### Nothing removed

No existing file was deleted or renamed. No existing controlled value, required property, GitHub Project, or write path was removed.

### Rollback procedure

This entire change is isolated to a single branch and a single draft PR; nothing was merged or deployed.

1. **Do nothing** — the branch `feat/canonical-portfolio-control-layer` has not been merged into `main`. Closing the draft PR and deleting the branch fully reverts the repository to `main` @ `3df9516`.
2. If any part of this change were merged in the future and needed to be undone: revert the merge commit via a new PR (`git revert -m 1 <merge-commit-sha>`), same as any other change on this repository. No data migration is required because:
   - The schema addition is optional frontmatter; no existing note was rewritten.
   - `PROJECT_REPO_REGISTRY.md` was not modified by this change.
   - No GitHub Project 2 field or item was created or modified by this change (it never ran against the live board — see below).
3. If the sync engine is later run for real against GitHub Project 2 and a rollback of board state is needed: every write the sync engine performs is additive/idempotent per-field, and `lib/portfolio/github-project-sync.ts`'s `applySync` returns a full structured log (`SyncOutcome.log`) of every field it changed, with old/new values recorded in the corresponding `SyncConflict`/plan entries for anything it did not overwrite. Use that log to manually restore prior field values in the GitHub Project UI; the sync engine does not delete items or fields, so no destructive board rollback is ever required.

### Unavoidable manual steps

1. **Grant the `project` OAuth scope.** The `gh` CLI token used in this environment has scopes `gist, read:org, repo, workflow` and explicitly lacks `read:project`/`project`. This blocks:
   - Live inspection of GitHub Project 2's existing fields/views.
   - Configuring the 8 required views (Command Center, Today, Active Work, Needs Audit, Blocked and Waiting, Agent Queue, Completed, Archive).
   - Running the sync engine against the real board (dry-run or otherwise).

   This requires a human to run, interactively (it opens a browser consent screen that cannot be completed non-interactively):

   ```bash
   gh auth refresh -h github.com -s read:project,project
   ```

   Once granted, `npm run portfolio:sync -- --project-id <GitHub Project 2 node ID> --dry-run` can be run for a live dry-run preview, and the 8 views can be configured via `gh project field-list` / `gh project view-list`-driven automation (not yet run against the live board in this change).

2. **View sort/group configuration.** As of GitHub's current Projects v2 API, per-view sort order, grouping, and column visibility are **not exposed via the GraphQL API** — only field/value CRUD is. Once the `project` scope above is granted, the 8 views' filters can be automated (via saved view queries), but each view's sort/group-by and visible-column order must be set once by hand in the GitHub UI. This is the "smallest unavoidable manual step" called for by the spec; everything else about the views (which items appear, via filter query) is automatable.

### Validation evidence

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — results recorded in the PR description for this branch.
- Sync engine dry-run evidence against **mocked** GitHub Project data — see `tests/portfolio-github-project-sync.test.ts` (test cases 9-15) and the CLI demo output in the PR description. Live dry-run against the real board is blocked by the missing `project` scope above.

## Entry: GitHub Project 2 Live Apply — Corrections and Field-Write Bug Fixes

- **Date**: 2026-08-04
- **Branch**: `feat/canonical-portfolio-control-layer` (same branch/PR as above)
- **Scope**: Applied the two required corrections to the portfolio model, then ran and applied the live GitHub Project 2 sync for the first time. Three bugs were found and fixed while verifying the live board state — see below. No default GitHub field or workflow was touched; no PR was merged.

### Corrections applied (as requested, before any live write)

1. **Portfolio Status is a new, separate field.** `REQUIRED_FIELD_DEFINITIONS` and `projectFieldValues()` in `lib/portfolio/github-project-sync.ts` now define/write `Portfolio Status` (11 Life OS values), never GitHub's default `Status` (Todo/In Progress/Done). `planFieldReuse`'s normalized-name matching cannot conflate the two names, so this is enforced structurally, not just by convention — see the new test "never fuzzy-matches Portfolio Status onto GitHub's default Status field."
2. **Index-note exclusion is now path-based, not a title exception.** `lib/portfolio/model.ts` adds `isIndexNote(path)`, matching the file's actual basename (`readme.md`, `index.md`, `_index.md`, `start_here.md`, case-insensitive) — never the note's rendered title. `10 Projects/README.md` has an `# Projects` H1 heading (so `VaultNote.title` reads "Projects"), which is why title-based matching was wrong; the file itself has no frontmatter and is folder documentation. This rule is applied generally, so any folder's `README.md` vault-wide is excluded the same way, and a legitimately-named project note (even one containing the word "Projects" in its title) is untouched — see `tests/portfolio-model.test.ts`.

### Bugs found and fixed while verifying the live apply

The revised dry-run (7 items, Portfolio Status as new field, 0 conflicts) passed cleanly and the apply conditions were met, but the **first live apply against the real, empty GitHub Project 2 board** surfaced three bugs that mocked-client tests hadn't caught, because the mocks didn't model GitHub's real per-field-type mutation contract or a genuinely empty starting board:

1. **`planSync` stripped every field from a newly created item.** It pre-filtered `fieldsToWrite` by `fieldPlan.missing` at plan time — but on a brand-new board every one of the 16 required fields is "missing" at plan time, even though `applySync` was about to create them a moment later in the same run. Result: items were created with zero Life OS field values. Fixed by removing that pre-filter; `applySync`'s existing per-write field-ID lookup is now the single source of truth for whether a field can actually be written, and correctly no-ops (with a warn log) only when a field genuinely will not exist.
2. **Single-select writes sent raw text.** GitHub's `UpdateProjectV2ItemFieldValueInput` requires `{ singleSelectOptionId }` for single-select fields (e.g. `Portfolio Status`, `Priority`, `Health`, `Sync Status`) and `{ date }` for date fields — never `{ text }` for either. Fixed by changing `ProjectsV2Client.updateItemField` to take the full `ProjectV2Field` (not just its ID) and shape the mutation value by `field.dataType`, with a guard that skips (rather than throws) when a proposed value doesn't match any option, or when a date value is empty.
3. **`listFields` misclassified DATE fields as TEXT.** The GraphQL query never actually requested the field's `dataType`; it *guessed* SINGLE_SELECT vs TEXT based only on whether `options` was present, so `Review Date`/`Last Verified`/`Due Date` came back looking like TEXT fields once fetched from the real board, defeating fix #2 for exactly the fields it was meant to protect. Fixed by requesting `dataType` directly in the query and mapping GitHub's `ProjectV2FieldType` enum properly (unrecognized types default to TEXT, which is safe since reuse is by exact field name).
4. **`projectFieldValues()` never wrote `Project ID`.** The field was created on the board but never populated on any item, which would have broken idempotency on every subsequent run (`planSync` matches existing items by their `Project ID` field value; with it never written, every run would look like 7 brand-new projects forever). Fixed by adding `Project ID` to the values written on every sync.

All four fixes are covered by new/updated tests: `tests/portfolio-github-project-sync.test.ts` (field-name collision guard, "writes real field values onto items even when required fields are created for the first time in the same apply run," "always writes the stable Project ID on create") and the new `tests/portfolio-github-project-client.test.ts` (mocks `fetch` to assert the exact mutation payload shape per field type).

### Live-board cleanup performed as part of this fix

Each of the three bugs above was caught by inspecting the live board immediately after an apply, before treating that apply as final. Every apply that produced incomplete items (bug 1, then bug 2/3) was followed by deleting only the specific items that run had just created (via `gh project item-delete`) — never any pre-existing board data, since Project 2 had 0 items before this session — and re-running dry-run → apply from clean field data once the underlying bug was fixed. The final apply (after all four fixes) produced 0 errors, and a subsequent no-op re-run confirmed idempotency (`would create: 0, would update: 0, unchanged: 7`).

### Rollback procedure (this entry)

- **Code**: isolated to the same unmerged branch/PR as above; closing the PR/branch fully reverts it.
- **Live board data**: to undo, delete the 16 additive fields and 7 items this run created on GitHub Project 2 (all listed in the report returned alongside this entry). GitHub's default `Status` field, its 3 options, and the 6 default workflows were never touched and need no rollback.

## Entry: Daily Operations Brief and Suggest Only Scheduling

- **Date**: 2026-08-08
- **Branch**: `feat/daily-operations-brief`
- **Base**: `feat/canonical-portfolio-control-layer` @ `846890bc4bbea3fb411077ece7cf85de63ae003b` (the exact head commit of PR #46 at the time this branch was created — **not** `main`, and not a rebuild of the portfolio layer). This branch was created via `git reset --hard 846890bc4bbea3fb411077ece7cf85de63ae003b` on top of a working branch that had incorrectly started from stale `main`, to guarantee the portfolio control layer (canonical models, GitHub Project sync, portfolio UI, `ChangePlanPersistence` write path, prompt-injection sanitization) is present as the required foundation.
- **Target for this dependent draft PR**: `feat/canonical-portfolio-control-layer` (not `main`). Nothing in this change merges anything or deploys to production.
- **Scope**: Adds the Daily Operations Brief and Suggest Only scheduling phase entirely as new, additive code. No portfolio file (`lib/portfolio/*`, `components/portfolio/*`, `app/portfolio/*`, `architecture/METADATA_SCHEMA.md`, `PROJECT_REPO_REGISTRY.md`) was modified. No Revenue Radar or voice file was touched. No new repository-write mechanism was introduced — canonical metadata changes still route exclusively through the existing `ChangePlanPersistence` → draft change plan → draft PR → human review path.

### What changed

| Area | Files | Nature of change |
|---|---|---|
| Data model | `lib/daily-brief/types.ts` | New `DailyOperationsBrief` model: stable ID, date, timezone, generation timestamp, state machine (`Draft` → `Awaiting Review` → `Approved` → `Active` → `Completed`, plus `Superseded`), revision number, mission, outcomes, Start Here, schedule, work orders, decisions, blocked/waiting/not-today items, changes-since-previous, assumptions/confidence, evidence/source-snapshot references, user edits, approved version, completion state, end-of-day review reference, timestamps. |
| Calendar | `lib/daily-brief/calendar.ts` | Inspects for an existing calendar integration (none exists in this codebase today) and reports `availability-assumed` mode with a documented integration gap. No paid dependency added. |
| Scheduler | `lib/daily-brief/scheduler.ts` | Suggest Only proposed-schedule builder: never creates/modifies a calendar event, excludes blocked/waiting/completed/deferred work, orders Start Here first, reserves a configurable buffer (default 20%), truncates to available capacity. |
| Work orders | `lib/daily-brief/work-orders.ts` | Builds "Proposed Agent Work Order — Not Running" cards only; `humanApprovalState` starts `Pending`; no runtime agent is ever launched by this code. |
| Generation engine | `lib/daily-brief/generate-brief.ts` | Pure `generateDailyBrief()`: selects ≤3 top outcomes, builds one Start Here action, computes blocked/waiting/not-today/decisions/changes-since-previous/assumptions/confidence, sanitizes all project-derived text via the existing `lib/portfolio/sanitize.ts`. |
| Persistence/reducers | `lib/daily-brief/store.ts` | Pure functions enforcing: an `Approved`/`Active`/`Completed` brief can never be silently overwritten (`addBriefRevision` throws); `regenerateAfterApproval` supersedes the prior revision and appends a new one, preserving full history; approve/edit/reorder/defer/schedule/work-order/review reducers. |
| End-of-day review | `lib/daily-brief/build-end-of-day-review.ts` | Diffs brief outcomes against current project state; the completed review is stored and consulted by the next brief's generation (via `previousReview`/`sourceSnapshotIds`). |
| Client persistence | `lib/daily-brief/use-daily-brief-store.ts` | Browser-local (`localStorage`) persistence for brief runtime state only, using the existing `useBrowserStorage` hook pattern already used elsewhere in the app (`OperationsSurface`, `VoiceConsole`). This is not canonical/cross-device data and never substitutes for the draft-PR write path. |
| UI | `app/daily-brief/page.tsx`, `components/daily-brief/DailyOperationsBriefApp.tsx`, `components/daily-brief/DailyOperationsBriefApp.module.css` | New `/daily-brief` page: mission, Start Here, ≤3 top outcomes, proposed schedule, work-order cards, decisions, blocked/waiting table, progressive disclosure for evidence/Not Today/changes/assumptions, end-of-day review workflow, previous-brief navigation, all required controls (Regenerate, Approve, Edit Mission, Mark Complete, Defer, Approve/Reject Schedule, Approve/Reject Work Order, Start/Complete End-of-Day Review). |
| Navigation | `components/shell/PortalSidebar.tsx` | Added a "Daily Brief" entry between Overview and Projects. |
| Tests | `tests/daily-brief-*.test.ts` (36 Vitest tests), `tests/e2e/daily-brief.spec.ts` (14 Playwright tests × 2 projects = 28 runs) | See verification section below. |
| Tooling | `package.json`, `package-lock.json`, `playwright.config.ts`, `.gitignore` | Added `@playwright/test@1.62.1` (exact-pinned devDependency) and a `test:e2e` script; Playwright config runs `chromium-desktop` and `chromium-mobile` (Pixel 7) projects against a production build; `.gitignore` excludes Playwright's local `playwright-report/` and `test-results/` output. |

### Source precedence, security, and Suggest Only guarantees (as implemented)

- The generation engine only reads from canonical `PortfolioProject` records (already sanitized/normalized by the existing portfolio layer) and the previous brief/review stored locally; it does not call any calendar or external API, so the full 10-item source-precedence list in the spec collapses today to "portfolio records → previous local brief/review," with every lower-precedence source (GitHub Project 2 live fields, calendar) explicitly marked unavailable/assumed rather than silently treated as absent.
- All project-derived free text (next actions, evidence strings, blocker/waiting text) is passed through `sanitizeImportedText()` before being placed in the brief, defending against prompt injection the same way the portfolio layer already does for repository evidence.
- `scheduleMode` is hardcoded to `"suggest-only"`; the scheduler contains no code path that calls any calendar-write API (none exists in the codebase to call). `tests/daily-brief-scheduler.test.ts` and `tests/daily-brief-generate.test.ts` assert no calendar-event side effects occur.
- Every `ProposedAgentWorkOrder` is created with `humanApprovalState: "Pending"` and a `prohibitedActions` list that always includes no-merge/no-admin/no-billing/no-deployment/no-credential-management constraints; nothing in this change spawns a process, calls an agent runtime, or grants any elevated permission.
- Any change to *canonical* project metadata (as opposed to local daily-brief runtime state) is out of scope for this phase's UI — the existing `ChangePlanPersistence` component and `/api/lifeos/change-plan` route are unchanged and remain the only path for that.

### Verification performed

Run from repo root on branch `feat/daily-operations-brief` @ `9311bd8` and later commits on this branch:

```bash
npm ci                     # dependency installation via lockfile
npx tsc --noEmit            # typecheck — 0 errors
npx eslint . --max-warnings=0   # lint — 0 errors, 0 warnings
npx vitest run               # 33 test files, 183 tests passed (147 pre-existing + 36 new daily-brief tests)
npm run build                 # production build succeeds; /daily-brief prerenders statically
npx playwright test            # 28 passed (14 tests × chromium-desktop + chromium-mobile), 0 failed
```

Playwright verification covers: opening view (mission/outcomes/Start Here/schedule/blockers/decisions), blocked-and-waiting visibility with guarantee blocked work never appears in the schedule table, proposed agent work-order cards labeled "Proposed Agent Work Order — Not Running", human decision cards, progressive-disclosure evidence toggle, long project names/next actions layout, schedule overflow into a reserved buffer block, previous-brief navigation across multiple stored dates, the full approve → start end-of-day review → complete end-of-day review workflow (including the native `confirm()`/`prompt()` dialogs the UI uses for consequential actions), keyboard navigation with visible focus, mobile viewport (390×844 / Pixel 7) readability, an honest empty state when no project qualifies as a top outcome, the pre-generation loading state, and a partial-data/stale-warning disclosure. Owner-preview screenshots (desktop opening view, evidence disclosed, mobile opening view) were captured against a local production build (`next build && next start`) and are referenced in `docs/DAILY_OPERATIONS_BRIEF.md`.

`npm audit` reports 7 pre-existing advisories (postcss, sharp, several Next.js advisories, vitest) that are present on the unmodified `feat/canonical-portfolio-control-layer` baseline as well (verified via `git stash`) — none introduced by this change, and none touch a file this change modifies.

### Known limitations

1. **No live calendar integration exists anywhere in this codebase.** `lib/daily-brief/calendar.ts` always reports `connected: false` and the brief always runs in `availability-assumed` mode with a default 09:00–17:00 window. This is intentional per the spec ("no paid dependency," "document the integration gap"), not a bug.
2. **No live GitHub Project 2 field read is wired into brief generation.** The generation engine consumes the already-synced `PortfolioProject` records produced by the existing portfolio layer; it does not make a second, separate live call to GitHub Project 2's operational fields during brief generation. Because the portfolio sync engine (PR #46) already keeps those fields in the vault's canonical records, this is consistent with, not a regression from, the existing architecture — but it means "GitHub Project 2 operational fields" as a distinct precedence tier is realized indirectly, through the portfolio sync's own output, rather than via a second direct read inside this phase.
3. **Daily Brief runtime state (revisions, reviews) is browser-local only** (`localStorage`), not synced across devices or persisted server-side. This matches the spec's allowance to use "an existing verified application persistence layer" or "the smallest maintainable persistence addition"; a durable, cross-device store was judged out of scope for this phase without introducing new infrastructure.
4. **No live Vercel preview URL can be produced or verified from this sandboxed environment** (no deployment credentials or network access to Vercel are available here). If this repository has an existing Vercel GitHub integration, opening the draft PR is expected to trigger an automatic preview deployment; the owner should check the PR's Vercel bot comment/checks for that URL. The screenshots captured against a local production build in `docs/DAILY_OPERATIONS_BRIEF.md` are provided as the closest available substitute evidence.

### Rollback procedure (this entry)

1. **Do nothing** — this branch is a dependent draft PR against `feat/canonical-portfolio-control-layer`, itself unmerged into `main`. Closing this draft PR and deleting `feat/daily-operations-brief` fully reverts the repository to the portfolio-layer-only state.
2. If any part of this change were merged in the future and needed to be undone: revert the merge commit via a new PR (`git revert -m 1 <merge-commit-sha>`). No canonical vault data, schema, or GitHub Project 2 field is touched by this change, so no data migration or board cleanup is required — only the new `lib/daily-brief/*`, `components/daily-brief/*`, `app/daily-brief/*`, and test/tooling files need to be removed.
3. Browser-local Daily Brief state can be cleared per-browser at any time via `localStorage.removeItem("lifeos-daily-brief-store-v1")`; it holds no canonical data and clearing it has no effect on the vault or GitHub Project 2.
