# LifeOS Universal Resource Intelligence — Foundation

**Implementation status:** Foundation slice in development under Issue #56.  
**System owner:** Resource Intelligence  
**Canonical storage:** GitHub-backed Obsidian Markdown Resource records  
**Write model:** Draft pull request only; no direct `main` writes

## Purpose

Universal Resource Intelligence gives LifeOS one governed path for capturing external or internal resources, identifying exact duplicates, creating one durable canonical Resource record, and routing later source-grounded evaluation without creating another command center or another source of truth.

The foundation extends the existing Capture/Inbox and existing `type: resource` metadata contract.

## Current foundation flow

```text
Quick Capture / Inbox
  → optional browser-local resource capture
  → intentional canonical promotion
  → normalize source identity
  → exact identity duplicate check
  → create or update one Resource Markdown record
  → create draft PR
  → owner review
```

Canonical promotion is fail-closed unless the existing LifeOS write authorization and GitHub write token are configured.

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

## Security and governance

- Uses the existing `LIFEOS_WRITE_ENABLED` + `LIFEOS_WRITE_SECRET` owner gate.
- Uses `LIFEOS_GITHUB_TOKEN` server-side only.
- Checks same-origin policy and rate limits intake requests.
- Creates a branch and **draft pull request** for every canonical Resource mutation.
- Never writes directly to `main`.
- File metadata intake does not upload or persist file bytes.
- The owner secret entered in the web UI is component state only and is not written to browser storage.

## Explicitly not complete in this foundation

The following Issue #56 lanes remain future implementation work and must not be reported as shipped:

- semantic title/topic duplicate detection
- GitHub repository inspection processor
- YouTube Knowledge Engine routing
- webpage/article extraction
- PDF/document content extraction
- licensing/cost/security/maintenance scoring
- stack-overlap analysis
- automatic asset factory
- implementation router / assigned execution agent
- staleness/dead-tool monitoring
- Slack intake adapter
- end-to-end resource state views for Processing / Review / Implementation / Watch / Completed / Archived
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

After this foundation is green:

1. Add source-grounded GitHub repository inspection.
2. Add duplicate/review state UI around the canonical Resource records.
3. Add architecture/disposition review controls with evidence.
4. Route YouTube to existing YouTube Knowledge assets rather than duplicating them.
5. Add semantic duplicate candidates as suggestions only.
6. Run the Issue #56 controlled acceptance candidate end to end.
