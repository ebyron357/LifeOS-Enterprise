---
type: dashboard
dashboard: weekly-review
status: active
review_date: 2026-07-20
tags: [dashboard, weekly-review]
---

# Weekly Review

> Clear open loops and reset execution for the next week.

## 1. Personal Growth

- [ ] Create this week's note from [[99 Templates/Personal Growth Check-In|Personal Growth Check-In]].
- [ ] Record wins with evidence.
- [ ] Name the main source of friction.
- [ ] Choose one small next action.
- [ ] Update [[30 Goals/Become My Best Self|Become My Best Self]] only after the check-in is complete.

```dataview
TABLE WITHOUT ID
  file.link AS "Goal",
  current_value AS "Current",
  target_value AS "Target",
  review_date AS "Review"
FROM "30 Goals"
WHERE type = "goal"
  AND status = "active"
  AND contains(string(area), "Personal Growth")
SORT review_date ASC
```

## 2. Active Projects

```dataview
TABLE priority, business, next_action, blocker, review_date
FROM "Projects"
WHERE type = "project" AND status = "active"
SORT priority ASC, impact DESC
```

## 3. Waiting / Blocked

```dataview
TABLE waiting_on, blocker, next_action, review_date
FROM "Projects"
WHERE type = "project" AND (status = "waiting" OR blocker OR waiting_on)
SORT review_date ASC
```

## 4. Businesses

```dataview
TABLE priority, status, kpi_focus, review_date
FROM "Businesses"
WHERE type = "business" AND status != "archived"
SORT priority ASC
```

## 5. Learning Due in 7 Days

```dataview
TABLE topic, mastery, next_action, review_date
FROM "Learning"
WHERE type = "learning" AND review_date AND review_date <= date(today) + dur(7 days)
SORT review_date ASC
```

## 6. Automations

```dataview
TABLE status, purpose, next_action, review_date
FROM "Automations"
WHERE type = "automation" AND status != "archived"
SORT review_date ASC
```

## 7. Metadata Gaps

```dataview
TABLE type, status, priority, next_action, review_date
FROM "Projects"
WHERE file.name != "README" AND (type != "project" OR !status OR !priority OR !next_action OR !review_date)
SORT file.name ASC
```

## 8. Decisions Made This Week

| Decision | Project/Business | Why | Follow-up |
|---|---|---|---|
|  |  |  |  |

## 9. Next Week Focus

- [ ] Define three outcomes.
- [ ] Confirm every active project has one next action.
- [ ] Remove or pause work that does not support current priorities.
