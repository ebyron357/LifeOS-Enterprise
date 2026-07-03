# LifeOS Enterprise — Object Model

> Defines all first-class object types in the LifeOS system, their properties, and their relationships.

---

## Overview

The LifeOS object model defines a typed taxonomy of notes. Every note in the vault belongs to exactly one type. Types determine:

- The required and optional frontmatter properties
- The canonical folder location
- The template used to create the note
- The dashboards and queries that surface the note

---

## Object Type Taxonomy

> **Status:** Placeholder — types below are provisional and require ratification in PROJECT_TRUTH.md.

### Core Types

| Type | Description | Canonical Location |
|------|-------------|-------------------|
| `daily-note` | Daily journal and task log | `00-Inbox/Daily/` |
| `project` | Bounded effort with a defined outcome | `01-Projects/` |
| `area` | Long-term responsibility or life domain | `02-Areas/` |
| `resource` | Reference material supporting areas/projects | `03-Resources/` |
| `person` | Contact or relationship note | `02-Areas/Relationships/People/` |
| `meeting` | Record of a meeting or conversation | `02-Areas/Relationships/Meetings/` |
| `goal` | A desired outcome with a target date | `02-Areas/Goals/` |
| `habit` | A recurring behavior to track | `02-Areas/Health/Habits/` |
| `decision` | A logged decision with context and rationale | `06-Meta/Decisions/` |
| `book` | A book reading note | `03-Resources/Books/` |
| `course` | A learning course note | `03-Resources/Learning/` |
| `reference` | General reference material | `03-Resources/References/` |
| `moc` | Map of Content — index note for a topic | Various |
| `dashboard` | Dataview-powered aggregate view | `07-Dashboards/` |
| `template` | Note scaffold (not a content note) | `05-Templates/` |
| `meta` | System configuration and meta-notes | `06-Meta/` |

---

## Object Type Definitions

### `daily-note`

A record of a single day. Serves as the primary capture and reflection surface.

**Key properties:**
- Date
- Energy level
- Top priorities
- Completed tasks
- Journal/reflection
- Links to meetings, decisions, notes created that day

---

### `project`

A bounded effort with a clear outcome and end date.

**Key properties:**
- Status (active, paused, completed, abandoned)
- Outcome statement
- Start date / Target end date
- Parent area
- Related goals
- Next action

---

### `area`

A long-term sphere of responsibility that does not have a completion date.

**Key properties:**
- Domain (work, health, finance, relationships, learning, personal)
- Status (active, on-hold)
- Current priority
- Active projects count (computed)

---

### `person`

A contact or relationship note.

**Key properties:**
- Name
- Relationship type (professional, personal, family)
- Organization
- Contact info
- Last contacted date
- Related meetings

---

### `goal`

A desired outcome with a measurable target.

**Key properties:**
- Outcome statement
- Target date
- Parent area
- Key results / milestones
- Status (active, achieved, abandoned)
- Review date

---

### `decision`

A record of a significant decision.

**Key properties:**
- Decision statement
- Date
- Context and options considered
- Rationale
- Expected outcome
- Review date (to assess outcome)

---

## Relationship Map

```
Area
 └── Project (many)
      └── Task (many, tracked inline or via task plugin)
 └── Goal (many)
      └── Project (many)
 └── Person (many)
      └── Meeting (many)

Daily Note
 ├── links to → Projects (current)
 ├── links to → Meetings (today)
 └── links to → Goals (focus)
```

---

## TODO

- [ ] Finalize the complete list of object types
- [ ] Define required vs. optional properties for each type
- [ ] Define the full relationship graph
- [ ] Ratify the type list in PROJECT_TRUTH.md
- [ ] Create a JSON schema or YAML schema file for validation
- [ ] Document naming conventions for each type
