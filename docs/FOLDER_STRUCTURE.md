# LifeOS Enterprise — Folder Structure

> Defines the canonical folder hierarchy for the LifeOS Obsidian vault.

---

## Overview

The folder structure follows a modified **PARA method** (Projects, Areas, Resources, Archives) with additional top-level folders for system needs. Every folder has a defined purpose and placement rules.

The structure is designed to be:
- **Stable** — Top-level folders rarely change
- **Scalable** — Handles thousands of notes without reorganization
- **Navigable** — A new user can orient themselves within minutes

---

## Top-Level Structure

```
Vault/
├── 00-Inbox/
├── 01-Projects/
├── 02-Areas/
├── 03-Resources/
├── 04-Archives/
├── 05-Templates/
├── 06-Meta/
└── 07-Dashboards/
```

Numeric prefixes enforce sort order in the file explorer.

---

## Folder Definitions

### `00-Inbox/`

**Purpose:** Temporary capture zone. Everything enters here first.

```
00-Inbox/
├── Daily/          # Daily notes
├── Capture/        # Quick-capture notes awaiting processing
└── Processed/      # Processed inbox items (before archival)
```

**Rules:**
- Inbox is processed during weekly review
- Notes in `00-Inbox/Capture/` must not stay longer than 7 days without processing
- Daily notes are created here and stay here permanently

---

### `01-Projects/`

**Purpose:** Active bounded efforts with defined outcomes.

```
01-Projects/
├── _index.md       # Projects MOC
├── Active/
│   └── [Project-Name]/
│       ├── _project.md    # Project note (type: project)
│       └── [notes...]
├── Paused/
└── Completed/
```

**Rules:**
- Each project has its own subfolder
- Each project folder contains a `_project.md` root note
- Completed projects move to `Completed/` and are archived within 90 days

---

### `02-Areas/`

**Purpose:** Long-term responsibilities and life domains.

```
02-Areas/
├── _index.md
├── Work/
├── Health/
│   └── Habits/
├── Finance/
├── Relationships/
│   ├── People/
│   └── Meetings/
├── Learning/
├── Personal/
└── Home/
```

**Rules:**
- Area folders are permanent and match the domain taxonomy in METADATA_SCHEMA.md
- Each area folder contains an `_area.md` root note (type: area)
- Subfolders within an area are allowed for organizational depth

---

### `03-Resources/`

**Purpose:** Reference material that supports areas and projects.

```
03-Resources/
├── _index.md
├── Books/
├── Articles/
├── Courses/
├── References/
├── Frameworks/
└── Prompts/        # AI prompts and templates
```

**Rules:**
- Resources are evergreen — they do not expire
- Resources are linked to areas/projects that use them
- Books and courses get individual notes (type: book, type: course)

---

### `04-Archives/`

**Purpose:** Completed or inactive notes kept for reference.

```
04-Archives/
├── Projects/       # Completed projects
├── Areas/          # Retired areas
└── [Year]/         # Year-based archival folders
```

**Rules:**
- Nothing in Archives is actively maintained
- Archives are searchable but not queried in dashboards (excluded by default)
- Annual archival pass moves stale content here

---

### `05-Templates/`

**Purpose:** Note templates used by the Templater plugin.

```
05-Templates/
├── Daily-Note.md
├── Weekly-Review.md
├── Monthly-Review.md
├── Project.md
├── Area.md
├── Person.md
├── Meeting.md
├── Goal.md
├── Book.md
└── [other templates...]
```

**Rules:**
- Templates are not content notes — they are excluded from all queries
- Template names match the object type they create
- Templates are maintained in this repository's `templates/` directory

---

### `06-Meta/`

**Purpose:** System configuration, logs, and meta-notes about the vault itself.

```
06-Meta/
├── System/
│   ├── VAULT_HEALTH.md
│   └── CHANGELOG.md
├── Decisions/      # Decision log notes
└── Reviews/
    ├── Weekly/
    ├── Monthly/
    ├── Quarterly/
    └── Annual/
```

**Rules:**
- Meta notes describe the system, not content
- Decision notes (type: decision) live in `06-Meta/Decisions/`
- Review notes are filed by cadence and dated

---

### `07-Dashboards/`

**Purpose:** Dataview-powered aggregate views and command center.

```
07-Dashboards/
├── Home.md             # Command center
├── Projects.md
├── Goals.md
├── Habits.md
├── Inbox-Review.md
├── Knowledge-Map.md
└── Areas/
    ├── Work.md
    ├── Health.md
    ├── Finance.md
    └── [per-area dashboards...]
```

**Rules:**
- Dashboard notes contain queries, not content
- Dashboards are excluded from backlink counts
- Dashboard queries must include scope filters to avoid performance issues

---

## Naming Conventions

| Rule | Format | Example |
|------|--------|---------|
| Project folders | `Title-Case-With-Dashes` | `Client-Proposal-Q3` |
| Note files | `Title Case.md` | `Weekly Review 2026-07-01.md` |
| System notes | `_prefixed.md` | `_project.md`, `_area.md` |
| Dated notes | `YYYY-MM-DD Description.md` | `2026-07-03 Meeting Notes.md` |
| Templates | `Type-Name.md` | `Daily-Note.md` |

---

## TODO

- [ ] Finalize the complete subfolder structure for each area
- [ ] Define archival triggers and automation for project completion
- [ ] Create `_index.md` and `_area.md` note templates
- [ ] Document folder exclusion rules for Dataview queries
- [ ] Define the vault initialization script that creates this structure
