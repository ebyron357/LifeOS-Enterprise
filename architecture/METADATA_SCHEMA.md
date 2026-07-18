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
