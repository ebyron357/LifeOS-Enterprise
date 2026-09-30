# LifeOS Universal Resource Intelligence — Foundation

**Implementation status:** Durable intake foundation merged via PR #66; read-only GitHub evidence processor merged via PR #68; owner review/disposition surface and resource state lanes merged and deployed via PR #71. Intake hardening (write-time source evidence, source-type routing, open-draft-PR dedupe, clean upstream read errors, and the aligned Resource template) is implemented on its own change and is not merged or deployed until that PR merges. End-to-end acceptance with the Issue #56 candidate remains open.  
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
  → GitHub source? optional read-only evidence preview in the panel
  → intentional canonical promotion
  → normalize source identity
  → route by source type (processor_route + next_action)
  → GitHub source? re-fetch evidence server-side at write time
  → exact identity duplicate check on main
  → open intake draft PR for the same record? update the record on its branch
  → otherwise create or update one Resource Markdown record on this request's own new intake branch
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

Repeated capture updates `last_captured`, increments `capture_count`, appends Capture History, and refreshes the Source Evidence section for GitHub sources. It does **not** overwrite a reviewed architecture classification or disposition, owner-entered Evaluation evidence, a review next action, or a manually edited `processor_route`.

## Capture-time truth boundary

New records start with:

- `processing_state: needs-review`
- `architecture_classification: PENDING`
- `disposition: PENDING`
- `processor_route` and `next_action` from the source-type routing table below
- `evidence_status`: `source-evidence-captured`, `capture-only`, or `evidence-unavailable`
- `evidence_inspected_at`: ISO time of the GitHub inspection, or empty when no processor ran

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

The web intake panel exposes this as **Inspect GitHub evidence** before the owner decides whether to stage a canonical Resource PR. That preview is not sent with the capture.

## Source evidence at write time

`POST /api/lifeos/resource-intake` re-fetches GitHub evidence **server-side** for every GitHub source when it writes the record. The request body is reduced to known capture fields, so evidence supplied by a client is ignored.

The record gets a `## Source Evidence` section after `## Evaluation` and before `## Capture History`, labelled as source evidence and not a disposition. It records:

- inspection time (ISO)
- default branch
- latest commit SHA and date, when available
- license as an SPDX identifier, or `none detected`
- stars and forks
- archived flag
- last push date
- the processor architecture suggestion (`TEMPLATE` only when README evidence supports it) and `PENDING` as the processor disposition suggestion

Frontmatter gains `evidence_status` and `evidence_inspected_at`. When evidence exists, the Evaluation `- Evidence:` line points to the Source Evidence section instead of saying capture only.

If the GitHub fetch fails, the record is still written with `evidence_status: evidence-unavailable` and a fixed error summary such as `GitHub repository metadata request failed (HTTP 404).` Upstream messages, URLs, and tokens are never copied into the record or the response.

On a repeated capture the Source Evidence section is replaced, never duplicated. A failed refresh does not erase evidence captured earlier: the earlier evidence and its `evidence_inspected_at` stay, and a single `Latest refresh attempt` line records the failure. Owner-entered classification, disposition, Evaluation evidence, and Review History are preserved.

## Source-type routing

Every record gets a deterministic `processor_route` and a matching `next_action`. Routes point only at processors, SOPs, and templates that exist in this repository:

| Source type | `processor_route` | Automated |
|---|---|---|
| `github` | GitHub evidence processor (LifeOS) | Yes: read-only evidence at write time |
| `youtube` | `80 SOPs/Process YouTube Video into LifeOS Knowledge.md` | No: manual SOP |
| `webpage`, `pdf-document`, `file` | `99 Templates/Technology or Repository Review.md` | No: manual template |
| `tool-course`, `social`, `generic-internal`, anything else | `owner-review` | No |

The route table lives in `lib/resource-intelligence/routing.ts`. `GET /api/lifeos/resource-intake` reports `capabilities.sourceProcessors.automated` as `["github"]` and lists every route with its automated flag.

A re-capture refreshes `processor_route` and `next_action` only while they still hold intake-generated values, so review decisions and manual edits are kept.

## Duplicate captures before merge

Exact identity dedupe reads `main`. To stop repeated captures of the same resource from opening competing draft PRs before the first one merges, every intake branch for one record shares a prefix: `lifeos/resource-intake/<record slug>--`. Each request stages on its **own** new branch, `<prefix><10-hex nonce>`.

- Before opening a PR, intake looks for an **open** pull request into `main` whose head branch starts with that prefix.
- If one exists, intake reads the record from that PR's branch and applies the normal duplicate update (capture count, Capture History, Source Evidence). It commits to that branch and returns the existing PR with `duplicateOf` and `dedupe: open-draft-pr`. No new PR is opened.
- Otherwise intake creates its own branch from the current `main`, writes the record there, and opens a new draft PR.
- **No branch is ever force-moved or reset.** A leftover branch from a merged or closed intake PR is simply ignored. Because each request uses its own branch, two simultaneous captures can never overwrite or delete each other's work. In the worst case, two captures submitted within the same second both open a draft PR, and the owner closes the extra one.
- Failure cleanup only deletes the branch this request created, and never one that backs an open PR.
- Every write still goes to a non-main branch behind a draft PR.

## Error handling

GitHub failures before any write (reading the canonical record, checking for an open intake PR, or resolving `main`) return a clean JSON `502` with a fixed message and the upstream status code only. Nothing is written in that case.

## Manual capture template

`99 Templates/Resource.md` follows the same record contract: the same frontmatter keys in the same order with empty or `PENDING` defaults (`capture_channel: obsidian-manual`, `processor_route: owner-review`, `evidence_status: capture-only`), and the same headings: Source, Evaluation, Source Evidence (optional), Capture History, Governance. It also keeps `topic`, `author`, and `created` for the Recently Added Resources base. Prefer the web intake, which computes identity and dedupes; the template is for captures made by hand in Obsidian.

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
- Stages every canonical Resource mutation on a non-main branch behind a **draft pull request**, including review decisions. Repeated captures of one record update its open intake PR instead of opening another.
- Fetches GitHub evidence for canonical records server-side with `LIFEOS_GITHUB_TOKEN`; client-supplied evidence is ignored.
- Intake and review share one GitHub draft-PR helper (`lib/github/draft-pr.ts`), which Continuity checkpoints also use.
- Never writes directly to `main`.
- File metadata intake does not upload or persist file bytes.
- The owner secret entered in the web UI is component state only and is not written to browser storage.

## Explicitly not complete in this foundation

The following Issue #56 lanes remain future implementation work and must not be reported as shipped:

- embedding-based semantic/topic duplicate detection (title-similarity and fork suggestions exist on `/resources/review`)
- automated YouTube processing (YouTube records route to the existing manual SOP; nothing is transcribed or extracted automatically)
- automated webpage/article extraction (web records route to the manual Technology or Repository Review template)
- automated PDF/document content extraction
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
7. GitHub evidence is fetched server-side at write time, and a fetch failure still writes the record as `evidence-unavailable`.
8. A second capture of the same record before its PR merges updates the open draft PR instead of opening another.
9. CI, vault audit, typecheck, lint, unit tests, and production build pass.

## Next implementation slice

After the GitHub processor slice is green:

Done in the review slice: resource state lanes, owner-entered architecture/disposition controls without auto-adoption, stack-overlap, value, effort, risk, license, and cost review fields, and suggestion-only duplicate candidates (title similarity and likely forks).

Remaining:

Done in the intake-hardening change: write-time GitHub source evidence, deterministic source-type routing to existing SOPs and templates, open-draft-PR dedupe, clean upstream read errors, and the aligned manual Resource template.

1. Automate YouTube processing on top of the existing YouTube Knowledge SOP rather than duplicating it.
2. Upgrade duplicate suggestions from title similarity to topic/embedding similarity, still as suggestions only.
3. Add dependency review and an automatic Processing state when source evidence is being gathered.
4. Run the Issue #56 controlled acceptance candidate `vercel-labs/knowledge-agent-template` end to end. This needs the owner write path configured.
5. Preserve the current expected candidate disposition (`ADAPT`) as a review outcome to prove from LifeOS overlap/evidence, not as a hard-coded processor result.

Prompt-like captures (`title`/`topic`/`tags` containing `prompt`) remain Resource Intelligence records at intake. After `EXTRACT`, canonicalize the reusable prompt under `40 Resources/Prompts/` as `type: prompt`. See `docs/PROMPT_INTELLIGENCE.md`.
