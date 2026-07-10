# Obsidian Life OS Specification v1.0

## Purpose

Create a practical, maintainable operating system for life, business, relationships, knowledge, and AI work using Obsidian native features first.

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
- `20 Areas` — ongoing responsibilities and standards.
- `30 Goals` — measurable targets connected to areas and projects.
- `40 Resources` — decisions, research, tools, ideas, agents, experiments, content, and automation records.
- `50 People` — relationship and contact notes.
- `60 Reviews` — weekly, monthly, quarterly, annual, and project reviews.
- `70 Journal` — daily notes and personal logs.
- `80 SOPs` — tested repeatable procedures.
- `90 Archive` — inactive or completed material.
- `99 Templates` — the only canonical template folder.

## Note Types

The supported types are defined in `architecture/METADATA_SCHEMA.md`. Do not create duplicate types or near-synonyms.

## Required Templates

- Daily Note
- Weekly Review
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

The main dashboard links to today, the inbox, reviews, active work, goals, areas, relationships, operations, and AI work.

### Business Dashboard

Shows revenue focus, active business projects, clients and people, content, SOPs, decisions, and risks.

### Personal Dashboard

Shows health, finances, relationships, home, learning, journal, and personal projects.

### Agentic Work Dashboard

Shows active agents, experiments, automations, decisions, evaluations, approval workflows, and risks.

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
5. Capture notes during the day.
6. Complete a brief reflection.
7. Move durable information to the correct permanent note.

## Weekly Workflow

1. Review wins and friction.
2. Review every active project.
3. Review goals and important areas.
4. Process `01 Inbox/`.
5. Review people needing follow-up.
6. Review the calendar and deadlines.
7. Select next week’s three outcomes.
8. Pause, archive, or cancel unnecessary commitments.

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
- goals connect to projects and areas;
- the inbox is processed during weekly review;
- relationships needing follow-up are visible;
- dashboards render using native Bases;
- the system works on desktop and mobile without requiring a large plugin stack.
