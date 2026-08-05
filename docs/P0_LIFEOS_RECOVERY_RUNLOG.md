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
