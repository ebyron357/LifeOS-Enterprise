# Life OS Metadata Schema

This file is the property contract for the vault. Properties exist only when they support filtering, sorting, grouping, review, automation, or reporting.

## Global Properties

Use these where applicable:

```yaml
---
type:
status:
area:
project:
goal:
owner:
created:
updated:
review_date:
tags:
---
```

## Controlled Values

### `type`

```text
daily
weekly-review
monthly-review
quarterly-review
annual-review
growth-checkin
project
area
goal
meeting
person
decision
resource
sop
agent
experiment
content
idea
automation
business
dashboard
```

### `status`

```text
inbox
planned
active
waiting
blocked
paused
complete
archived
cancelled
draft
review
approved
decided
design
```

### `priority`

```text
P0
P1
P2
P3
```

### Dates

Use ISO dates:

```yaml
created: 2026-07-10
updated: 2026-07-10
review_date: 2026-07-17
due_date: 2026-08-01
```

### Links

Use Obsidian links for relationships when possible:

```yaml
area: "[[Business]]"
project: "[[Build Agentic Shopify Store]]"
goal: "[[Launch Store by Q4]]"
```

## Required Properties by Type

### Project

```yaml
---
type: project
status: active
area:
goal:
owner:
priority: P1
start_date:
due_date:
review_date:
next_action:
tags:
  - project
---
```

Required: `type`, `status`, `owner`, `priority`, `review_date`, `next_action`.

### Business

```yaml
---
type: business
status: active
priority: P1
owner:
kpi_focus:
review_date:
tags:
  - business
---
```

Required: `type`, `status`, `priority`, `review_date`.

### Dashboard

```yaml
---
type: dashboard
dashboard: daily-command-center
status: active
review_date:
tags:
  - dashboard
---
```

Required: `type`, `status`, `review_date`.

### Area

```yaml
---
type: area
status: active
owner:
review_frequency: monthly
standard:
review_date:
tags:
  - area
---
```

### Goal

```yaml
---
type: goal
status: active
area:
timeframe:
target_date:
metric:
starting_value:
target_value:
current_value:
review_date:
tags:
  - goal
---
```

Required: `type`, `status`, `area`, `target_date`, `metric`, `current_value`, `target_value`.

### Personal Growth Check-In

```yaml
---
type: growth-checkin
status: active
date:
overall_state:
next_action:
review_date:
tags:
  - review
  - personal-growth
---
```

Required: `type`, `date`, `next_action`, and `review_date`.

Use words or evidence for `overall_state`. A numeric score is optional and must come from the user's own assessment; the system must not invent it.

### Person

```yaml
---
type: person
status: active
relationship:
company:
role:
last_contact:
next_contact:
tags:
  - person
---
```

### Decision

```yaml
---
type: decision
status: decided
date:
project:
area:
review_date:
tags:
  - decision
---
```

### Resource

```yaml
---
type: resource
status: active
source:
author:
topic:
created:
review_date:
tags:
  - resource
---
```

### SOP

```yaml
---
type: sop
status: active
area:
owner:
version: 1.0
last_tested:
review_date:
tags:
  - sop
---
```

### Agent

```yaml
---
type: agent
status: design
project:
owner:
risk_level:
version: 0.1
review_date:
tags:
  - agent
---
```

## Validation Rules

1. No active project may have a blank `next_action`.
2. Every active project must have an owner and review date.
3. Every goal must be measurable and connected to an area.
4. Use links for `area`, `project`, and `goal` relationships when possible.
5. Do not invent new property names when an existing standard property fits.
6. Property names use lowercase snake_case.
7. Empty optional properties may remain blank; required properties may not.
8. Archived notes use `status: archived` and live under `90 Archive/` when practical.
9. Personal growth ratings must be self-reported or evidence-based; automation may summarize them but may not fabricate them.

## Portfolio Extension (canonical portfolio control layer)

These properties are **additive and optional** on existing `type: project` notes. They extend, and never replace, the Required Properties by Type above. A project note with none of these fields is still fully valid; the portfolio layer computes safe defaults (see `lib/portfolio/model.ts`) instead of requiring a rewrite of existing notes.

```yaml
---
project_id:            # stable slug, e.g. "build-ai-consultant-portfolio"; derived from filename if absent
outcome:                # one-sentence intended outcome; falls back to the note's "## Outcome" section if absent
phase:                  # free-text current phase, e.g. "Pilot", "Discovery", "Build"
health:                 # On Track | At Risk | Blocked | Unknown
portfolio_status:       # see Portfolio Status below; if absent, derived from legacy `status`
last_verified:          # ISO date the project's repo/status/next_action were last human- or evidence-confirmed
assigned_agent:         # optional link to a `type: agent` note; a record only, never an execution claim
canonical_repo:         # "owner/name" of the single canonical repository, if any
reference_repos:        # list of "owner/name" repositories that are references, duplicates, or experiments
github_project_item_id: # opaque ID of the linked GitHub Project 2 item, once synchronized
evidence:               # list of short evidence strings/links backing status or health claims
sync_status:            # Not Synced | Synced | Conflict | Sync Error
---
```

### Portfolio Status (computed/optional)

This is a normalized superset of the legacy `status` field above, used by the portfolio layer and GitHub Project 2. It does not replace `status`; existing notes are not required to adopt it. Legacy → Portfolio Status mapping is fixed and documented in `lib/portfolio/model.ts`.

```text
Inbox
Needs Review
Needs Audit
Planned
Ready
Active
Waiting
Blocked
Review
Completed
Archived
```

Legacy → Portfolio Status defaults (used only when `portfolio_status` is absent):

| Legacy `status` | Portfolio Status |
|---|---|
| `inbox` | Inbox |
| `planned`, `draft`, `design` | Planned |
| `active`, `approved`, `decided` | Active |
| `waiting` | Waiting |
| `blocked` | Blocked |
| `paused` | Waiting |
| `review` | Review |
| `complete` | Completed |
| `archived`, `cancelled` | Archived |
| anything else / missing | Needs Review |

### Portfolio Priority (computed/optional)

Maps directly from the existing `priority` (`P0`-`P3`) scale; `priority` itself is unchanged.

| `priority` | Portfolio Priority |
|---|---|
| `P0` | Critical |
| `P1` | High |
| `P2` | Medium |
| `P3` | Someday |
| missing | Medium |

### Repository Classification (per repository, not per project)

Used in `canonical_repo`/`reference_repos` mapping evidence (see `docs/PORTFOLIO_REPOSITORY_MAPPING_PROPOSAL.md`), never written into project frontmatter directly:

```text
Canonical
Reference
Duplicate Review
Template
Experiment
Archive Candidate
Archived
Unknown
```

### Portfolio validation rules

1. `portfolio_status`, `health`, and `sync_status`, when present, must use only the controlled values above.
2. `assigned_agent` must reference an existing `type: agent` note by wikilink; it records an intended human/agent owner and must never be read as proof of autonomous execution.
3. `canonical_repo` must be a single `owner/name` string; `reference_repos` is always a list, even with one entry.
4. A project may have zero or one `canonical_repo`, and any number of `reference_repos`.
5. `last_verified` is set only from direct evidence (a command run, a fetched page, a merged PR) — never backfilled with today's date as a default.
