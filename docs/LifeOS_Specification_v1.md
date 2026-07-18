# Obsidian Life OS Specification v1.0

## Purpose

Create a practical, maintainable operating system for life, business, relationships, knowledge, personal growth, and AI work using Obsidian native features first.

## Core Operating Model

```text
Daily Notes
    ↓
Weekly Reviews
    ↓
Projects and Areas
    ↓
Goals and Life Direction
```

Personal growth uses the same trusted loop:

```text
Daily Awareness
    ↓
Weekly Growth Check-In
    ↓
One Small Next Action
    ↓
Evidence-Based Goal Progress
```

Business and AI work extends the model:

```text
Projects
    ↓
Decisions
    ↓
SOPs
    ↓
Agents
    ↓
Experiments
```

## Canonical Vault Structure

```text
00 Home/
01 Inbox/
10 Projects/
20 Areas/
30 Goals/
40 Resources/
50 People/
60 Reviews/
70 Journal/
80 SOPs/
90 Archive/
99 Templates/
```

### Folder Responsibilities

- `00 Home` — dashboards, navigation, and Bases.
- `01 Inbox` — unprocessed captures only.
- `10 Projects` — outcomes with a finish line.
- `20 Areas` — ongoing responsibilities and standards, including Personal Growth.
- `30 Goals` — measurable targets connected to areas and projects.
- `40 Resources` — decisions, research, tools, ideas, agents, experiments, content, and automation records.
- `50 People` — relationship and contact notes.
- `60 Reviews` — weekly, monthly, quarterly, annual, project, and personal growth reviews.
- `70 Journal` — daily notes and personal logs.
- `80 SOPs` — tested repeatable procedures.
- `90 Archive` — inactive or completed material.
- `99 Templates` — the only canonical template folder.

## Note Types

The supported types are defined in `architecture/METADATA_SCHEMA.md`. Do not create duplicate types or near-synonyms.

## Required Templates

- Daily Note
- Weekly Review
- Personal Growth Check-In
- Monthly Review
- Project
- Area
- Goal
- Meeting
- Person
- Decision
- Resource
- SOP
- Agent Specification
- Experiment
- Business or Product Idea
- Content Brief
- Automation Workflow

## Required Bases

Located in `00 Home/Bases/`:

- Active Projects
- Projects Needing Review
- Goals by Timeframe
- Areas Overview
- People to Contact
- Recently Added Resources
- Active SOPs
- Agent Registry
- Decisions Needing Review
- Archive

## Required Dashboards

### Life OS

The main dashboard links to today, the inbox, reviews, active work, goals, areas, relationships, personal growth, operations, and AI work.

### Business Dashboard

Shows revenue focus, active business projects, clients and people, content, SOPs, decisions, and risks.

### Personal Dashboard

Shows health, finances, relationships, home, learning, journal, and personal projects.

### Personal Growth Dashboard

Shows the active growth goal, recent check-ins, the current focus, and a small next action. It must not invent personal ratings or turn a difficult week into a failure state.

### Agentic Work Dashboard

Shows active agents, experiments, automations, decisions, evaluations, approval workflows, and risks.

## Personal Growth Standard

The Personal Growth system contains:

- one ongoing Personal Growth area;
- measurable goals connected to that area;
- a short daily awareness prompt;
- one weekly check-in;
- wins supported by evidence;
- one clear point of friction;
- one small next action;
- support or automation opportunities;
- human approval for health, money, relationship, or other sensitive actions.

The system may summarize information the user provides. It may not invent scores, diagnoses, feelings, or completed actions.

## Native Plugin Policy

Enable these core plugins first:

- Templates
- Daily notes
- Properties view
- Bases
- Bookmarks
- Canvas

Community plugins are optional:

- Templater — advanced dynamic templates.
- QuickAdd — repeatable capture commands.
- Tasks — recurring tasks and vault-wide task reporting.
- Calendar — visual daily-note navigation.
- Dataview — only when Bases cannot express a required view.

## Daily Workflow

1. Open today’s Daily Note.
2. Select three outcomes.
3. Review the calendar.
4. Add immediate tasks.
5. Use the 60-second personal growth reflection when useful.
6. Capture notes during the day.
7. Complete a brief reflection.
8. Move durable information to the correct permanent note.

## Weekly Workflow

1. Complete the personal growth check-in.
2. Review wins and friction.
3. Review every active project.
4. Review goals and important areas.
5. Process `01 Inbox/`.
6. Review people needing follow-up.
7. Review the calendar and deadlines.
8. Select next week’s three outcomes.
9. Pause, archive, or cancel unnecessary commitments.

## Project Standard

Every active project must have:

- one desired outcome;
- measurable success criteria;
- one current next action;
- an owner;
- a status;
- a priority;
- a review date;
- an area link;
- a due date when appropriate.

## Goal Standard

Every active goal must have:

- a measurable outcome;
- a target date;
- a current value;
- a target value;
- a related area;
- related projects;
- lead and lag measures.

## SOP Standard

Every active SOP must include:

- purpose;
- trigger;
- inputs and requirements;
- exact numbered procedure;
- expected result;
- validation checklist;
- exceptions and troubleshooting;
- owner, version, last-tested date, and review date.

## Agent Standard

Every agent specification must define:

- objective and user;
- trigger, inputs, and outputs;
- allowed tools and permissions;
- prohibited behavior;
- human approval points;
- memory and data-access rules;
- failure and fallback behavior;
- evaluation cases;
- success metrics and risks.

## Implementation Order

1. Foundation — folders, properties, core templates.
2. Navigation — dashboards, Bases, bookmarks.
3. Relationships and operations — people, meetings, SOPs.
4. Decisions and knowledge — decisions and resources.
5. Business and AI — agents, experiments, automation, content.
6. Automation — only after repeated manual friction is verified.

## Success Criteria

The system succeeds when:

- the correct next action is visible within one minute;
- every active project is trustworthy and current;
- personal growth is reviewed without overload or invented data;
- goals connect to projects and areas;
- the inbox is processed during weekly review;
- relationships needing follow-up are visible;
- dashboards render using native Bases;
- the system works on desktop and mobile without requiring a large plugin stack.
