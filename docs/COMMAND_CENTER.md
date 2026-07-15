# LifeOS — Command Center

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

The Command Center is the homepage of LifeOS. It is the single view where the operator sees the state of their entire system — businesses, projects, tasks, agents, repositories, knowledge, meetings, decisions, automations, risks, KPIs, and notifications — and acts on the highest-priority items without navigating away.

The Command Center does not store data. It surfaces data computed by the Execution Engine from canonical module sources.

---

## Aggregated Modules

The Command Center aggregates signals from every module:

| Module | What It Contributes |
|--------|---------------------|
| `/businesses` | Business health, KPI status, attention flags |
| `/projects` | Active projects, priority scores, next actions, blockers |
| `/agents` | Agent activity status, assigned tasks, escalations |
| `/github` | Repository health, open PRs, open issues, last commit |
| `/knowledge` | Knowledge objects due for review, coverage gaps |
| `/meetings` | Upcoming meetings, unprocessed meeting notes |
| Calendar | Upcoming deadlines, review dates, scheduled reviews |
| Waiting On | Items awaiting input from others |
| `/decisions` | Proposed decisions needing resolution, recent decisions |
| Risks | Open high-impact risks without mitigation |
| KPIs | KPIs off-track against targets |
| Notifications | Escalations, automation failures, agent alerts |
| `/automations` | Automation health, recent failures |

---

## Command Center Sections

### 1. Today's Priorities
Ordered list of the highest-priority items for the current day, produced by the Priority Engine.

Fields per item:
- `item_id` — ID of the project or task
- `title` — Name of the item
- `priority_score` — Computed priority score
- `urgency` — `Critical` / `Overdue` / `Due Today` / `Due This Week`
- `owner` — Responsible person or agent
- `next_action` — Single most important step

### 2. Decision Queue
Proposed decisions that require the operator's resolution before blocked work can proceed.

Fields per item:
- `decision_id` — ID from Decision schema
- `title` — Decision title
- `blocking` — Projects blocked by this decision
- `days_open` — Days since the decision was logged as Proposed
- `owner` — Decision owner

### 3. Waiting On
Work items where progress depends on input, response, or action from someone outside the current session.

Fields per item:
- `item_id` — Project, task, or deliverable ID
- `title` — What is being waited on
- `waiting_for` — Person or system
- `since` — Date added to waiting list
- `days_waiting` — Computed days since `since`

### 4. AI Recommendations
Suggestions from the Recommendation Engine, ordered by actionability.

See [EXECUTION_ENGINE.md](./EXECUTION_ENGINE.md) for the full list of recommendation types.

### 5. Highest ROI
Top 5 items ranked by ROI score from the ROI Engine.

### 6. Blocked Work
Items that cannot proceed. Produced by the Blocker Engine.

### 7. Upcoming Deadlines
Deliverables and review dates within the next 14 days, sorted by date.

### 8. Business Health
At-a-glance health status for each active business.

Fields per business:
- `business_id`
- `health_score` — From Health Engine
- `kpis_off_track` — Count of KPIs below target
- `open_risks` — Count of open High risks
- `projects_active` — Count of active projects
- `attention_required` — Boolean flag

### 9. Repository Health
GitHub repository summary for all linked repositories.

Fields per repository:
- `repo_name`
- `open_prs` — Count of open pull requests
- `open_issues` — Count of open issues
- `last_commit` — Date of most recent commit
- `days_since_commit` — Computed staleness
- `health_flag` — `Healthy` / `Stale` / `At Risk`

### 10. Automation Status
Overview of all active automations.

Fields per automation:
- `automation_id`
- `name`
- `last_run` — Date of last execution
- `last_run_status` — `Success` / `Failed` / `Skipped`
- `consecutive_failures` — Count of consecutive failures
- `requires_attention` — Boolean

### 11. Knowledge Review Queue
Knowledge objects due for review or flagged as `Needs Review`.

### 12. Notifications
System alerts including escalations, automation failures, agent errors, and threshold breaches.

---

## Navigation

The Command Center links directly to every module for drill-down:

```
Command Center
├── → /businesses/{slug}
├── → /projects/{id}
├── → /decisions/{id}
├── → /agents/{id}
├── → /github/{repo}
├── → /knowledge/{id}
├── → /automations/{id}
└── → /dashboards/{name}
```

---

## Daily Workflow

The expected operator workflow using the Command Center:

```
1. Open Command Center
2. Review Today's Priorities — identify the #1 action
3. Review Decision Queue — unblock any waiting work
4. Review Waiting On — follow up on outstanding items
5. Review Notifications — handle escalations
6. Review Recommendations — act on AI-surfaced signals
7. Begin execution on priority items
8. Update project status and next actions before closing session
```

---

## Command Center Templates

Templates for each review cadence are located in `/command-center/`:

| Template | Location | Purpose |
|----------|----------|---------|
| Daily | `/command-center/daily/DAILY_TEMPLATE.md` | Daily operator briefing |
| Weekly | `/command-center/weekly/WEEKLY_TEMPLATE.md` | Weekly review and planning |
| Monthly | `/command-center/monthly/MONTHLY_TEMPLATE.md` | Monthly business review |
| Quarterly | `/command-center/quarterly/QUARTERLY_TEMPLATE.md` | Quarterly strategy review |
| Annual | `/command-center/annual/ANNUAL_TEMPLATE.md` | Annual planning and retrospective |

---

## Future Extensions

- **Real-time dashboard** — Live data feeds via WebSocket API
- **AI briefing** — Chief of Staff generates a written briefing summary at session start
- **Natural language query** — "What are my blockers today?" → filtered view
- **Mobile view** — Responsive Command Center for mobile operators
- **Push notifications** — Escalations and deadline alerts delivered via Slack or email
- **Multi-operator** — Personalized Command Center views per operator with shared data
