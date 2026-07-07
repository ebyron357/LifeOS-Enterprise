# Weekly Review

Purpose: Clear open loops and reset execution for the next week.

## 1. Active Projects

```dataview
TABLE priority, business, next_action, blocker, review_date
FROM "Projects"
WHERE status = "active"
SORT priority ASC, impact DESC
```

## 2. Waiting / Blocked

```dataview
TABLE waiting_on, blocker, next_action, review_date
FROM "Projects"
WHERE status = "waiting" OR blocker OR waiting_on
SORT review_date ASC
```

## 3. Businesses

```dataview
TABLE status, kpi_focus, review_date
FROM "Businesses"
WHERE status != "archived"
SORT priority ASC
```

## 4. Learning

```dataview
TABLE topic, mastery, next_action, review_date
FROM "Learning"
WHERE review_date <= date(today) + dur(7 days)
SORT review_date ASC
```

## 5. Automations

```dataview
TABLE status, purpose, next_action, review_date
FROM "Automations"
WHERE status != "archived"
SORT review_date ASC
```

## 6. Decisions Made This Week

| Decision | Project/Business | Why | Follow-up |
|---|---|---|---|
|  |  |  |  |

## 7. Next Week Focus

Top 3 outcomes:

- [ ] 
- [ ] 
- [ ] 
