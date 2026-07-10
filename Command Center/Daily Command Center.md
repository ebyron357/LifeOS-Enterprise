---
type: dashboard
dashboard: daily-command-center
status: active
review_date: 2026-07-17
tags: [dashboard, daily, command-center]
---

# Daily Command Center

> Open this note first. It should show what deserves attention today in under one minute.

## Highest-Impact Next Actions

```dataview
TABLE priority, business, impact, effort, next_action, blocker
FROM "Projects"
WHERE type = "project" AND status = "active" AND next_action
SORT priority ASC, impact DESC, effort ASC
LIMIT 5
```

## Deadlines

```dataview
TABLE deadline, priority, next_action, business
FROM "Projects"
WHERE type = "project" AND deadline AND status != "complete" AND status != "archived"
SORT deadline ASC
```

## Waiting On / Blocked

```dataview
TABLE waiting_on, blocker, next_action, review_date
FROM "Projects"
WHERE type = "project" AND (status = "waiting" OR waiting_on OR blocker)
SORT review_date ASC
```

## Active Projects

```dataview
TABLE priority, business, impact, effort, next_action, review_date
FROM "Projects"
WHERE type = "project" AND status = "active"
SORT priority ASC, impact DESC, effort ASC
```

## Reviews Due

```dataview
TABLE type, status, next_action, review_date
FROM "Projects" OR "Businesses" OR "Knowledge" OR "SOPs" OR "Tools"
WHERE type AND file.name != "README" AND review_date AND review_date <= date(today)
SORT review_date ASC
```

## Learning Due

```dataview
TABLE topic, mastery, next_action, review_date
FROM "Learning"
WHERE type = "learning" AND review_date AND review_date <= date(today)
SORT review_date ASC
```

## Inbox Count

```dataview
TABLE file.mtime AS "Last Modified"
FROM "Inbox"
WHERE file.name != "README"
SORT file.mtime DESC
```

## End-of-Day Closeout

- [ ] Update completed project tasks.
- [ ] Set tomorrow's highest-impact next action.
- [ ] Process or intentionally defer Inbox items.
