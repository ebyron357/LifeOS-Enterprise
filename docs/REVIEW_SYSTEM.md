# LifeOS Enterprise — Review System

> Defines the review cadences, workflows, and governance system for LifeOS Enterprise.

---

## Overview

The review system is what separates a living knowledge system from an archive. Without regular review, notes decay into noise, projects stall unnoticed, and goals drift from behavior.

LifeOS Enterprise implements a **hierarchical review cadence** — each cadence feeds into the next, ensuring both tactical (daily) and strategic (annual) alignment.

---

## Review Cadence Overview

| Cadence | Duration | Focus | Note Type |
|---------|----------|-------|-----------|
| Daily | 10–15 min | Today's priorities, yesterday's captures | `daily-note` |
| Weekly | 45–60 min | Projects, inbox, goals, next week | `weekly-review` |
| Monthly | 60–90 min | Goals, areas, habits, finances | `monthly-review` |
| Quarterly | 2–3 hours | Goals, projects, life domains, system health | `quarterly-review` |
| Annual | Half day | Vision, major goals, roles, system redesign | `annual-review` |

---

## Daily Review

**Purpose:** Start each day with clarity and intention. End each day with capture and reflection.

**Morning routine (5–10 min):**
1. Open today's daily note (auto-created)
2. Review yesterday's incomplete tasks
3. Set today's top 3 priorities
4. Note any scheduled meetings
5. Set an intention for the day

**Evening routine (5 min):**
1. Log wins and progress
2. Capture anything worth remembering
3. Rate energy and mood
4. Identify tomorrow's most important task

**Automation hooks:**
- Daily note created automatically by Periodic Notes plugin
- Inbox aging flag runs at end of day

---

## Weekly Review

**Purpose:** Close out the week, process all loose ends, and plan the next week intentionally.

**Standard workflow (45–60 min):**

1. **Capture sweep** — Empty mind, all loose captures into inbox
2. **Inbox processing** — File or discard all inbox items
3. **Calendar review** — Review last week's calendar; any follow-ups?
4. **Projects review** — For each active project: status, blockers, next action
5. **Goals check** — Any progress toward goals this week?
6. **Habits review** — Check habit completion rate
7. **Next week planning** — Define top 3 weekly priorities and schedule them
8. **System health** — Any friction points to note or fix?

**Required output:**
- Completed weekly review note (type: review) in `06-Meta/Reviews/Weekly/`
- All active projects have a confirmed next action
- Inbox is empty

---

## Monthly Review

**Purpose:** Step back from the weekly grind to assess progress toward goals and evaluate area health.

**Standard workflow (60–90 min):**

1. **Wins and lessons** — What worked this month? What didn't?
2. **Goals progress** — Assess progress on all active goals; update milestones
3. **Projects audit** — Any projects that should be paused, cancelled, or broken down?
4. **Areas health check** — Rate each life domain: Work, Health, Finance, Relationships, Learning
5. **Habits review** — Month-over-month completion rates; any habits to add/drop?
6. **Financial snapshot** — High-level review (spending categories, savings progress)
7. **Next month intentions** — Set 1–3 monthly priorities
8. **System friction log** — Note any system pain points for quarterly resolution

---

## Quarterly Review

**Purpose:** Strategic alignment check. Are your projects and habits actually moving you toward your goals?

**Standard workflow (2–3 hours):**

1. **Life domains assessment** — Deep dive on each area; what's thriving, what's neglected?
2. **Goals audit** — Review all goals; advance, pause, or close each one
3. **Project portfolio review** — Is the project mix aligned with current priorities?
4. **Roles review** — Are you fulfilling your key life roles at the level you intend?
5. **Habits audit** — Which habits are locked in? Which need reworking?
6. **System redesign** — Address any structural friction. Update templates, reorganize as needed.
7. **Next quarter intentions** — Set 3–5 quarterly goals

---

## Annual Review

**Purpose:** High-altitude reflection on the year past and design of the year ahead.

**Standard workflow (half day):**

1. **Year in review** — Read all monthly review notes; identify themes
2. **Wins and gratitude** — Capture the year's most meaningful moments
3. **Major lessons** — What did this year teach you?
4. **Goals outcome review** — Which goals were achieved? Which were abandoned and why?
5. **Life domains deep dive** — Where did each domain end the year?
6. **Vision review** — Is the system's vision still aligned with who you are becoming?
7. **Next year design** — Define the year's theme, 5–7 major goals, and one word
8. **System retirement** — Archive the year's completed projects and reviews

---

## System Health Checks

Beyond personal reviews, the system itself requires maintenance reviews.

### Monthly System Check (15 min)
- Are all templates still working correctly?
- Any plugins with broken functionality?
- Any orphaned notes without a type?
- Frontmatter validation pass

### Quarterly System Audit (30 min)
- Review automation logs for errors
- Check for plugin updates
- Audit folder structure for unexpected drift
- Review and update this document if needed

---

## Review Governance

### Review Completion Tracking
Every review note has:
- `status: completed` in frontmatter when done
- The actual completion date logged
- A rating for quality/depth (optional)

### Missed Review Protocol
If a review is missed:
- **Daily:** Skip; do not catch up. Carry forward any urgent items.
- **Weekly:** Do a shortened version within 3 days. Note it was late.
- **Monthly+:** Do the full review even if late. Capture why it was missed.

### Review Note Archival
- Weekly reviews: Keep forever in `06-Meta/Reviews/Weekly/`
- Monthly reviews: Keep forever in `06-Meta/Reviews/Monthly/`
- Quarterly and Annual: Keep forever, never archive

---

## TODO

- [ ] Build all review templates in Phase 2
- [ ] Build the Weekly Review dashboard in Phase 3
- [ ] Create automation that flags overdue reviews
- [ ] Define the exact frontmatter schema for review notes
- [ ] Create the review completion tracker dashboard
- [ ] Document the minimum viable review workflow for high-friction periods
