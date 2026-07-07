# LifeOS Metadata Schema

Purpose: Standardize every note so dashboards can be generated from metadata instead of manual tracking.

## Global Properties

Use these properties where applicable.

```yaml
status: active | paused | waiting | complete | archived
priority: P0 | P1 | P2 | P3
owner: Byron
business:
deadline:
next_action:
effort: low | medium | high
impact: low | medium | high
review_date:
tags: []
created:
updated:
```

## Project Properties

```yaml
type: project
status: active
priority: P1
owner: Byron
business:
deadline:
next_action:
effort:
impact:
review_date:
waiting_on:
blocker:
```

Required fields:

- `status`
- `priority`
- `next_action`
- `review_date`

## Business Properties

```yaml
type: business
status: active
priority: P1
owner: Byron
kpi_focus:
active_projects: []
review_date:
```

## Knowledge Properties

```yaml
type: knowledge
summary:
source:
confidence: low | medium | high
related_concepts: []
applications: []
review_date:
```

## SOP Properties

```yaml
type: sop
status: active
owner: Byron
purpose:
inputs: []
outputs: []
quality_check:
review_date:
```

## Tool Properties

```yaml
type: tool
category:
url:
login_url:
cost:
projects_using_it: []
last_used:
review_date:
status: active
```

## URL Properties

```yaml
type: url
website:
purpose:
category:
related_tool:
tags: []
review_date:
```

## Dashboard Logic

Dashboards should prioritize notes by:

1. `status = active`
2. `priority = P0` or `P1`
3. nearest `deadline`
4. highest `impact`
5. lowest `effort`
6. oldest `review_date`

## Rule

No active project is allowed to exist without a `next_action`.
