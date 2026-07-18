---
type: dashboard
dashboard: daily-command-center
status: active
review_date: 2026-07-20
tags: [dashboard, daily, command-center]
---

# Daily Command Center

> Open this note first. It should show what deserves attention today in under one minute.

## Personal Growth — 60 Seconds

- What strengthened me today?
- What drained me?
- What is one small next action?
- [[00 Home/Personal Growth Dashboard|Open Personal Growth Dashboard]]

## Highest-Impact Next Actions

```dataview
TABLE WITHOUT ID
  file.link AS "Project",
  priority AS "Priority",
  business AS "Business",
  impact AS "Impact",
  effort AS "Effort",
  next_action AS "Next Action",
  blocker AS "Blocker"
FROM "Projects"
WHERE type = "project"
  AND status = "active"
  AND next_action
  AND lower(file.name) != "readme"
SORT priority ASC, impact DESC, effort ASC
LIMIT 5
```

## Deadlines

```dataview
TABLE WITHOUT ID
  file.link AS "Project",
  deadline AS "Deadline",
  priority AS "Priority",
  next_action AS "Next Action",
  business AS "Business"
FROM "Projects"
WHERE type = "project"
  AND deadline
  AND status != "complete"
  AND status != "archived"
  AND lower(file.name) != "readme"
SORT deadline ASC
```

## Waiting On / Blocked

```dataview
TABLE WITHOUT ID
  file.link AS "Project",
  waiting_on AS "Waiting On",
  blocker AS "Blocker",
  next_action AS "Next Action",
  review_date AS "Review Date"
FROM "Projects"
WHERE type = "project"
  AND (status = "waiting" OR waiting_on OR blocker)
  AND lower(file.name) != "readme"
SORT review_date ASC
```

## Active Projects

```dataview
TABLE WITHOUT ID
  file.link AS "Project",
  priority AS "Priority",
  business AS "Business",
  impact AS "Impact",
  effort AS "Effort",
  next_action AS "Next Action",
  review_date AS "Review Date"
FROM "Projects"
WHERE type = "project"
  AND status = "active"
  AND lower(file.name) != "readme"
SORT priority ASC, impact DESC, effort ASC
```

## Reviews Due

```dataview
TABLE WITHOUT ID
  file.link AS "Item",
  type AS "Type",
  status AS "Status",
  next_action AS "Next Action",
  review_date AS "Review Date"
FROM ""
WHERE (startswith(file.path, "Projects/")
    OR startswith(file.path, "Businesses/")
    OR startswith(file.path, "Knowledge/")
    OR startswith(file.path, "SOPs/")
    OR startswith(file.path, "Tools/")
    OR startswith(file.path, "20 Areas/")
    OR startswith(file.path, "30 Goals/")
    OR startswith(file.path, "60 Reviews/"))
  AND lower(file.name) != "readme"
  AND type
  AND review_date
  AND date(review_date) <= date(today)
SORT date(review_date) ASC
```

## Learning Due

```dataview
TABLE WITHOUT ID
  file.link AS "Learning Item",
  topic AS "Topic",
  mastery AS "Mastery",
  next_action AS "Next Action",
  review_date AS "Review Date"
FROM "Learning"
WHERE type = "learning"
  AND lower(file.name) != "readme"
  AND review_date
  AND date(review_date) <= date(today)
SORT date(review_date) ASC
```

## Capture Inbox

Drop unprocessed thoughts here, then move them later.

- [ ] 

## Inbox Items

```dataview
TABLE WITHOUT ID
  file.link AS "Inbox Item",
  file.mtime AS "Last Modified"
FROM "Inbox"
WHERE lower(file.name) != "readme"
SORT file.mtime DESC
```

## End-of-Day Closeout

- [ ] Update completed project tasks.
- [ ] Set tomorrow's highest-impact next action.
- [ ] Process or intentionally defer Inbox items.
