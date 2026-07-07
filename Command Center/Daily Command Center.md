# Daily Command Center

Purpose: Open this note first. It should show what deserves attention today.

## Today’s Priorities

- [ ] 
- [ ] 
- [ ] 

## Highest-Impact Next Action

- [ ] 

## Deadlines

```dataview
TABLE deadline, priority, next_action, business
FROM "Projects"
WHERE deadline AND status != "complete" AND status != "archived"
SORT deadline ASC
```

## Waiting On

```dataview
TABLE waiting_on, next_action, review_date
FROM "Projects"
WHERE status = "waiting" OR waiting_on
SORT review_date ASC
```

## Active Projects

```dataview
TABLE priority, business, impact, effort, next_action, review_date
FROM "Projects"
WHERE status = "active"
SORT priority ASC, impact DESC, effort ASC
```

## Reviews Due

```dataview
TABLE type, status, next_action, review_date
FROM "Projects" OR "Businesses" OR "Knowledge" OR "SOPs" OR "Tools"
WHERE review_date <= date(today)
SORT review_date ASC
```

## Learning Due

```dataview
TABLE mastery, next_action, review_date
FROM "Learning"
WHERE review_date <= date(today)
SORT review_date ASC
```

## Capture Inbox

Drop unprocessed thoughts here, then move them later.

- 

## End-of-Day Closeout

- What got completed?
- What is still open?
- What is tomorrow’s highest-impact action?
