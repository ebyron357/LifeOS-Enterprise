# LifeOS — Review Engine

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

The Review Engine implements structured review workflows at five cadences: Daily, Weekly, Monthly, Quarterly, and Annual. Each review automatically assembles a review packet from system metadata, eliminating the need to manually compile status updates.

Reviews are not meetings. They are structured introspection events that help the operator maintain awareness of the system's health, progress, and direction.

---

## Review Cadences

| Cadence | Frequency | Primary Purpose | Template |
|---------|-----------|----------------|---------|
| Daily | Every working day | Execution alignment | `/command-center/daily/DAILY_TEMPLATE.md` |
| Weekly | Every Monday | Progress review and planning | `/command-center/weekly/WEEKLY_TEMPLATE.md` |
| Monthly | First Monday of month | Business health review | `/command-center/monthly/MONTHLY_TEMPLATE.md` |
| Quarterly | First week of quarter | Strategic review and OKRs | `/command-center/quarterly/QUARTERLY_TEMPLATE.md` |
| Annual | January | Annual retrospective and planning | `/command-center/annual/ANNUAL_TEMPLATE.md` |

---

## Data Auto-Assembled by Review Type

### Daily Review Packet
Assembled from:
- Active projects with status updates in the last 24 hours
- Today's scheduled deliverable due dates
- Agent activity from the last session
- Automation run results from the last 24 hours
- Pending decisions in the Decision Queue
- Waiting-on items overdue by 3+ days
- Any new GitHub PRs or issues opened

### Weekly Review Packet
Assembled from:
- **Completed Work** — Deliverables moved to `Done` in the last 7 days
- **Outstanding Work** — Active deliverables still in `In Progress` or `Not Started` past their due date
- **Risks** — All open risks with severity `High` or new risks added this week
- **Lessons Learned** — Knowledge objects created or updated this week
- **Business Metrics** — KPI actual vs. target for the current period
- **Knowledge Growth** — Knowledge objects created, updated, or reviewed this week
- **Repository Activity** — Commits, PRs merged, issues closed per linked repository
- **Agent Activity** — Tasks completed per agent, escalations raised, idle agents
- **Automation Status** — Automation success/failure rate, any failures requiring attention

### Monthly Review Packet
All weekly review fields plus:
- **Revenue and financial metrics** from `/businesses/{slug}/finance/`
- **Project portfolio health** — all projects scored by Priority Engine
- **Decisions made this month** — count and average time-to-resolve
- **Knowledge base growth** — total object count, new objects, deprecated objects
- **Agent performance** — tasks completed, quality scores if available
- **Automation impact** — estimated time saved this month

### Quarterly Review Packet
All monthly review fields plus:
- **OKR progress** — Objectives and key results assessed against targets
- **Strategic decisions** — All `Strategic` decisions made this quarter
- **Business trajectory** — 3-month trend for each business KPI
- **Repository health** — Code quality signals, open issue aging
- **Roadmap progress** — Phase and milestone completion status

### Annual Review Packet
All quarterly review fields plus:
- **Year in review** — Completed projects, closed decisions, retired knowledge
- **Business growth summary** — Year-over-year KPI comparison
- **System health retrospective** — Average Health Scores over the year
- **Knowledge compounding** — Knowledge objects in use across multiple projects
- **Agent evolution** — Agent capability growth, new agents deployed
- **Next year planning inputs** — Inputs for the next annual planning cycle

---

## Review Process

Each review follows this structured process:

```
1. Auto-assemble review packet from system metadata
2. Operator reviews assembled data (read-only pass)
3. Operator adds observations and lessons learned
4. Operator updates project priorities and next actions
5. Operator resolves any decisions surfaced in the packet
6. Operator confirms the review is complete
7. Review record is stored in the appropriate cadence folder
```

---

## Review Storage

Completed reviews are stored as time-stamped records:

```
command-center/
├── daily/
│   ├── DAILY_TEMPLATE.md
│   └── YYYY-MM-DD.md               # Completed daily records
├── weekly/
│   ├── WEEKLY_TEMPLATE.md
│   └── YYYY-WW.md                  # Completed weekly records (ISO week)
├── monthly/
│   ├── MONTHLY_TEMPLATE.md
│   └── YYYY-MM.md                  # Completed monthly records
├── quarterly/
│   ├── QUARTERLY_TEMPLATE.md
│   └── YYYY-QN.md                  # Completed quarterly records
└── annual/
    ├── ANNUAL_TEMPLATE.md
    └── YYYY.md                     # Completed annual records
```

---

## Review Triggers

Reviews can be triggered in three ways:

| Trigger | Method |
|---------|--------|
| **Schedule** | Cron automation fires at review time and assembles packet |
| **Operator** | Operator opens the template manually |
| **Agent** | Chief of Staff agent opens a review session at scheduled time |

---

## Lessons Learned Integration

Lessons learned captured during any review are promoted to the Knowledge Engine:
- A new knowledge object is created in `/knowledge/` with `domain: operations`
- The object is linked to the review session (by date and cadence)
- The object is tagged for review at the next equivalent cadence

---

## Review Health Signal

The Review Engine contributes to the system's Execution Score:

```
review_cadence_score = (reviews_completed_on_time / reviews_scheduled) × 100
```

A score below 70% triggers an alert in the Command Center. See [HEALTH_SCORING.md](./HEALTH_SCORING.md).

---

## Cross-References

| Module | Relationship |
|--------|-------------|
| `/projects` | Primary source for completed and outstanding work |
| `/businesses` | Business metrics and KPI data |
| `/knowledge` | Knowledge growth metrics and lessons learned capture |
| `/agents` | Agent activity summaries |
| `/automations` | Automation health and failure reports |
| `/github` | Repository activity data |
| `/decisions` | Decisions made and pending in the review period |
| `/command-center` | Review outputs are stored here |

---

## Future Extensions

- **AI-generated summary** — Chief of Staff agent writes a prose summary of the assembled review packet
- **Insight detection** — Engine flags unusual patterns (e.g., 3 consecutive weeks of 0 completed deliverables)
- **Review export** — Review packets exported to PDF for stakeholder distribution
- **Calendar integration** — Reviews auto-scheduled in Google Calendar via MCP connector
- **Notification** — Operator reminded of pending reviews via Slack
