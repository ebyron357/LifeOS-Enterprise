# LifeOS Universal Resource Intelligence — Foundation

**Implementation status:** Durable intake foundation merged via PR #66; read-only GitHub evidence processor merged via PR #68; owner review/disposition surface and resource state lanes added on branch `claude/quirky-sagan-1m56r5` (not production until merged and deployed). End-to-end acceptance with the Issue #56 candidate remains open.  
**System owner:** Resource Intelligence  
**Canonical storage:** GitHub-backed Obsidian Markdown Resource records  
**Write model:** Draft pull request only; no direct `main` writes

## Purpose

Universal Resource Intelligence gives LifeOS one governed path for capturing external or internal resources, identifying exact duplicates, creating one durable canonical Resource record, and routing later source-grounded evaluation without creating another command center or another source of truth.

The foundation extends the existing Capture/Inbox and existing `type: resource` metadata contract.

## Current flow

```text
Quick Capture / Inbox
  → optional browser-local resource capture
  → GitHub source? inspect read-only repository evidence
  → intentional canonical promotion
  → normalize source identity
  → exact identity duplicate check
  → create or update one Resource Markdown record
  → create draft PR
  → owner review
  → /resources/review: owner records architecture + disposition
  → review draft PR (never main)
```

GitHub inspection is read-only and does not require canonical write authorization. Canonical promotion remains fail-closed unless the existing LifeOS write authorization and GitHub write token are configured.

## Stable identity rules

LifeOS currently uses the strongest deterministic identity available:

| Source | Exact identity |
|---|---|
| GitHub repository | lowercase `owner/repository` |
| YouTube video | video ID |
| Webpage/PDF URL | normalized canonical URL with common tracking parameters removed |
| File metadata | supplied content hash |
| Internal/generic source | deterministic hash of normalized source text |

A matching exact identity maps to the same canonical path under:

`40 Resources/Resource Intelligence/Records/`

Repeated capture updates `last_captured`, increments `capture_count`, and appends Capture History. It does **not** overwrite a reviewed architecture classification or disposition.

## Capture-time truth boundary

New records start with:

- `processing_state: needs-review`
- `architecture_classification: PENDING`
- `disposition: PENDING`

Capture alone is not evidence that a resource should be adopted, implemented, licensed, trusted, secure, current, or valuable.

The controlled review values are:

- Architecture: `PLATFORM / TEMPLATE / PROJECT`
- Disposition: `ADOPT / ADAPT / EXTRACT / WATCH / ARCHIVE / REJECT`

## Current supported source categorization

The foundation can identify:

- GitHub repository
- YouTube video
- PDF/document URL
- known course platform
- social URL
- generic webpage
- file metadata
- generic/internal reference

This categorization is source-shape detection only. It is not the later source processor.

## GitHub evidence processor

For GitHub repository sources, LifeOS can inspect source-grounded public/repository-authorized evidence before canonical promotion.

The processor reads:

- repository metadata: canonical name, description, default branch, archived/visibility state, stars/forks/open issues, update/push dates, and repository-reported license
- README content
- root file/directory names
- recent commit evidence
- package manifest presence
- `SECURITY.md` presence
- architecture/documentation presence
- README signals for file-based knowledge, source synchronization, and sandboxing

The processor may return an **architecture suggestion of `TEMPLATE` only when README evidence explicitly describes the repository as a template/starter/boilerplate and provides clone/fork/customization-style evidence**.

It does not automatically suggest `PLATFORM` or `PROJECT` from weak heuristics. When evidence is insufficient, the architecture suggestion remains empty.

The processor never chooses a business disposition. `dispositionSuggestion` remains `PENDING` until overlap, value, effort, risk, licensing, cost, and implementation evidence are reviewed.

The web intake panel exposes this as **Inspect GitHub evidence** before the owner decides whether to stage a canonical Resource PR.

## Owner review and disposition

`/resources/review` shows every canonical record under `40 Resources/Resource Intelligence/Records/` in six lanes:

| Lane | Rule |
|---|---|
| Needs review | disposition `PENDING` |
| Processing | disposition `PENDING` and `processing_state: processing` |
| Implementation | `ADOPT`, `ADAPT`, or `EXTRACT`, not yet completed |
| Watch | `WATCH` |
| Completed | `processing_state: completed` |
| Archived | `ARCHIVE` or `REJECT` |

Records whose `review_date` has passed are flagged as review due in the Needs review, Processing, and Watch lanes. Records captured more than once show the exact-duplicate capture count.

The page also lists **possible duplicates** across different exact identities: GitHub repositories with the same name under different owners (possible forks), and records whose titles share at least 60% of their words. These are suggestions only. Nothing is merged, and the owner decides in review whether two records describe the same resource.

The owner records a decision with `POST /api/lifeos/resource-review` (`lib/resource-intelligence/review.ts`):

- The disposition must be one of `ADOPT / ADAPT / EXTRACT / WATCH / ARCHIVE / REJECT`; `PENDING` is not a decision.
- A source-grounded rationale of at least 12 characters is required.
- `ADOPT` and `ADAPT` require a `PLATFORM`, `TEMPLATE`, or `PROJECT` classification.
- `WATCH` requires a next review date.
- Optional review fields: evidence, stack overlap, value/effort/risk (`low / medium / high`), license, and cost. They are stored as `stack_overlap`, `value_rating`, `effort_rating`, `risk_rating`, `license_review`, and `cost_review`.
- An already-reviewed record is never overwritten silently. A revision requires `revise: true` and is appended to Review History with the previous disposition.
- The decision updates `status`, `processing_state`, `architecture_classification`, `disposition`, `reviewed_at`, `next_action`, and the Evaluation section, and appends a `## Review History` entry. Source identity and Capture History are untouched, and a later re-capture keeps the review.
- The target path must match the canonical Records folder; any other path is rejected before GitHub access.

LifeOS never chooses the disposition and never implements a resource. Merging the review draft PR records the owner's decision.

## Security and governance

- Uses the existing `LIFEOS_WRITE_ENABLED` + `LIFEOS_WRITE_SECRET` owner gate.
- Uses `LIFEOS_GITHUB_TOKEN` server-side only.
- Checks same-origin policy and rate limits intake requests.
- Creates a branch and **draft pull request** for every canonical Resource mutation, including review decisions.
- Intake and review share one GitHub write helper (`lib/resource-intelligence/github-write.ts`).
- Never writes directly to `main`.
- File metadata intake does not upload or persist file bytes.
- The owner secret entered in the web UI is component state only and is not written to browser storage.

## Explicitly not complete in this foundation

The following Issue #56 lanes remain future implementation work and must not be reported as shipped:

- embedding-based semantic/topic duplicate detection (title-similarity and fork suggestions exist on `/resources/review`)
- YouTube Knowledge Engine routing
- webpage/article extraction
- PDF/document content extraction
- automated licensing/cost/security/maintenance scoring (the owner can record license, cost, and risk manually in review)
- automated stack-overlap analysis (the owner can record overlap manually in review)
- automatic asset factory
- implementation router / assigned execution agent
- staleness/dead-tool monitoring
- Slack intake adapter
- acceptance proof using `vercel-labs/knowledge-agent-template`

## Foundation acceptance checks

Before merging this slice:

1. Unit tests prove GitHub and YouTube URL variants resolve to one stable identity.
2. URL normalization removes common tracking parameters.
3. File metadata can use a supplied hash as identity without uploading bytes.
4. Duplicate capture preserves already-reviewed classification/disposition.
5. Disabled writes and invalid owner authorization fail before GitHub access.
6. Canonical promotion creates a draft PR and never writes `main`.
7. CI, vault audit, typecheck, lint, unit tests, and production build pass.

## Next implementation slice

After the GitHub processor slice is green:

Done in the review slice: resource state lanes, owner-entered architecture/disposition controls without auto-adoption, stack-overlap, value, effort, risk, license, and cost review fields, and suggestion-only duplicate candidates (title similarity and likely forks).

Remaining:

1. Route YouTube to existing YouTube Knowledge assets rather than duplicating them.
2. Upgrade duplicate suggestions from title similarity to topic/embedding similarity, still as suggestions only.
3. Add dependency review and an automatic Processing state when source evidence is being gathered.
4. Run the Issue #56 controlled acceptance candidate `vercel-labs/knowledge-agent-template` end to end. This needs the owner write path configured.
5. Preserve the current expected candidate disposition (`ADAPT`) as a review outcome to prove from LifeOS overlap/evidence, not as a hard-coded processor result.

Prompt-like captures (`title`/`topic`/`tags` containing `prompt`) remain Resource Intelligence records at intake. After `EXTRACT`, canonicalize the reusable prompt under `40 Resources/Prompts/` as `type: prompt`. See `docs/PROMPT_INTELLIGENCE.md`.
