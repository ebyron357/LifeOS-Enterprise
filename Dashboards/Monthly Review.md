# Monthly Review

Purpose: Review goals, KPIs, systems, and archive what no longer matters.

## 1. Monthly Goals

| Goal | Status | Result | Next Step |
|---|---|---|---|
|  |  |  |  |

## 2. Business KPIs

```dataview
TABLE kpi_focus, status, review_date
FROM "Businesses"
WHERE status != "archived"
SORT priority ASC
```

## 3. Project Portfolio

```dataview
TABLE status, priority, business, impact, effort, next_action
FROM "Projects"
WHERE status != "archived"
SORT status ASC, priority ASC
```

## 4. Systems Review

Review:

- Capture
- Processing
- Dashboards
- Templates
- AI workflows
- Automations
- Review cadence

## 5. Archive Candidates

```dataview
TABLE status, review_date, next_action
FROM "Projects" OR "Knowledge" OR "Tools" OR "URLs"
WHERE status = "paused" OR status = "complete"
SORT review_date ASC
```

## 6. Improvements

- What created leverage?
- What created noise?
- What should be automated?
- What should be deleted?

## 7. Next Month Focus

- [ ] 
- [ ] 
- [ ] 
