---
type: dashboard
dashboard: monthly-review
status: active
review_date: 2026-08-01
tags: [dashboard, monthly-review]
---

# Monthly Review

> Review goals, KPIs, system health, and archive what no longer matters.

## 1. Monthly Goals

| Goal | Status | Result | Next Step |
|---|---|---|---|
|  |  |  |  |

## 2. Business KPIs

```dataview
TABLE priority, kpi_focus, status, review_date
FROM "Businesses"
WHERE type = "business" AND status != "archived"
SORT priority ASC
```

## 3. Project Portfolio

```dataview
TABLE status, priority, business, impact, effort, next_action, review_date
FROM "Projects" OR "10 Projects"
WHERE type = "project" AND status != "archived"
SORT status ASC, priority ASC, impact DESC
```

## 4. Stale Active Projects

```dataview
TABLE priority, business, next_action, review_date
FROM "Projects" OR "10 Projects"
WHERE type = "project" AND status = "active" AND review_date AND review_date < date(today)
SORT review_date ASC
```

## 5. Archive Candidates

```dataview
TABLE type, status, review_date, next_action
FROM "Projects" OR "10 Projects" OR "Knowledge" OR "Tools" OR "URLs"
WHERE type AND file.name != "README" AND (status = "paused" OR status = "complete")
SORT review_date ASC
```

## 6. System Health

```dataview
TABLE type, status, review_date
FROM "Dashboards" OR "workflows" OR "AI"
WHERE file.name != "README" AND type
SORT file.folder ASC, file.name ASC
```

## 7. Improvements

- What created leverage?
- What created noise?
- What should be automated?
- What should be deleted?
- Which project should be paused?

## 8. Next Month Focus

- [ ] Choose three measurable outcomes.
- [ ] Confirm business KPI focus.
- [ ] Archive completed or irrelevant work.
