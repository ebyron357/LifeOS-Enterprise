# LifeOS Enterprise — Dashboard Specification

> Defines the design, purpose, and structure of all dashboard notes in the LifeOS system.

---

## Overview

Dashboards are Obsidian notes that aggregate views of other notes using Dataview queries. They serve as command centers, review surfaces, and real-time status monitors for each life domain.

This document defines:
- Dashboard design principles
- The complete dashboard inventory
- Layout and section standards
- Query design guidelines
- Performance requirements

---

## Design Principles

### 1. Dashboards Are Views, Not Data
Dashboards contain queries and structure, not content. All data lives in properly typed notes. If a dashboard is deleted, no information is lost.

### 2. Scoped Queries Only
Every Dataview query must specify a `FROM` clause. Unscoped queries that scan the entire vault are prohibited.

### 3. Actionable by Default
Every dashboard must surface at least one actionable item — a next action, an overdue review, an open task. Dashboards that only display passive information are insufficient.

### 4. Fast Rendering
Queries must be designed for performance. Target render time is under 2 seconds for any dashboard.

### 5. Mobile-Friendly Layout
Dashboards should be readable on mobile Obsidian without requiring horizontal scrolling.

---

## Dashboard Inventory

> **Status:** Placeholder — dashboards will be built in Phase 3.

| Dashboard | File | Purpose | Priority |
|-----------|------|---------|---------|
| Command Center | `07-Dashboards/Home.md` | Master overview of everything | P0 |
| Projects | `07-Dashboards/Projects.md` | All active projects and next actions | P0 |
| Goals | `07-Dashboards/Goals.md` | Goal tracking and progress | P0 |
| Inbox | `07-Dashboards/Inbox-Review.md` | Unprocessed captures | P0 |
| Weekly Review | `07-Dashboards/Weekly-Review.md` | Weekly review support view | P0 |
| Habits | `07-Dashboards/Habits.md` | Habit tracking | P1 |
| Work Area | `07-Dashboards/Areas/Work.md` | Work domain overview | P1 |
| Health Area | `07-Dashboards/Areas/Health.md` | Health domain overview | P1 |
| Finance Area | `07-Dashboards/Areas/Finance.md` | Finance domain overview | P1 |
| Knowledge Map | `07-Dashboards/Knowledge-Map.md` | Resources and learning overview | P2 |
| Relationships | `07-Dashboards/Areas/Relationships.md` | People and meetings | P2 |

---

## Command Center (Home Dashboard)

The Home dashboard is the single entry point for daily use.

**Required sections:**
1. **Today** — Today's date, top priorities, current energy
2. **Active Projects** — List of active projects with next actions
3. **Open Loops** — Inbox items, stale tasks, overdue reviews
4. **Quick Capture** — Link to create a new capture note
5. **Focus Goal** — Current primary goal and progress

---

## Projects Dashboard

**Required sections:**
1. **Active Projects** — Table of all active projects: name, area, target date, next action
2. **Paused Projects** — Projects currently on hold
3. **Overdue** — Projects past their target date
4. **Recently Completed** — Last 5 completed projects

---

## Goals Dashboard

**Required sections:**
1. **Active Goals** — All active goals by area with progress
2. **Next Milestones** — Upcoming key result deadlines
3. **Achieved This Year** — Completed goals, year-to-date
4. **Stale Goals** — Goals not reviewed in 30+ days

---

## Weekly Review Dashboard

**Required sections:**
1. **Week in Review** — Last 7 days' daily notes
2. **Project Statuses** — All active projects
3. **Inbox Count** — Unprocessed inbox items
4. **Goals Check** — Progress on active goals
5. **Habits Summary** — Last 7 days' habit completion
6. **Next Week** — Planning section for upcoming week

---

## Query Design Guidelines

> **Note:** Dataview query implementation is deferred to Phase 3. These are design guidelines.

### Performance Rules
- Always use `FROM "folder"` to scope queries
- Avoid `WHERE` clauses that require scanning all note properties
- Limit result sets with `LIMIT N` for list views
- Use `SORT` only on indexed fields (date, status)

### Standard Query Patterns
- Active projects: `FROM "01-Projects/Active" WHERE type = "project" AND status = "active"`
- Recent captures: `FROM "00-Inbox/Capture" SORT file.ctime DESC LIMIT 10`
- Goals due soon: `FROM "02-Areas" WHERE type = "goal" AND target-date <= date(today) + dur(30 days)`

---

## TODO

- [ ] Build all P0 dashboards in Phase 3
- [ ] Define the Dataview version requirement
- [ ] Profile query performance with 1,000+ note test vault
- [ ] Define the mobile layout strategy
- [ ] Create dashboard refresh/reload automation
- [ ] Document dashboard-specific frontmatter conventions
