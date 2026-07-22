---
type: dashboard
status: active
created: 2026-07-18
updated: 2026-07-18
review_date: 2026-07-30
tags:
  - dashboard
  - personal-growth
---

# Personal Growth Dashboard

> [!tip] Keep this light
> Notice what is true, choose one useful action, and stop. This is a support system—not a test.

## Start Here

- [[20 Areas/Personal Growth|Personal Growth Area]]
- [[30 Goals/Become My Best Self|Become My Best Self]]
- [[99 Templates/Personal Growth Check-In|Create a Personal Growth Check-In]]
- [[Dashboards/Weekly Review|Weekly Review]]

## Active Personal Growth Goals

```dataview
TABLE WITHOUT ID
  file.link AS "Goal",
  metric AS "Measure",
  current_value AS "Current",
  target_value AS "Target",
  target_date AS "Target Date",
  review_date AS "Review"
FROM "30 Goals"
WHERE type = "goal"
  AND status = "active"
  AND contains(string(area), "Personal Growth")
SORT target_date ASC
```

## Recent Check-Ins

```dataview
TABLE WITHOUT ID
  file.link AS "Check-In",
  date AS "Date",
  overall_state AS "Overall State",
  next_action AS "Next Action",
  review_date AS "Next Review"
FROM "60 Reviews"
WHERE type = "growth-checkin"
SORT date DESC
LIMIT 8
```

## Quick Reflection

- What is working?
- What is taking too much energy?
- Which growth area needs care—not pressure?
- What is the smallest useful next action?
- What support or automation would make that action easier?

## Guardrails

- No made-up scores.
- Use evidence when possible.
- One difficult week does not erase progress.
- Health and safety come before productivity.
- Keep the next action small enough to begin.
