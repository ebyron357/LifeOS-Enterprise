# LifeOS Enterprise — Architecture

> Canonical reference for the system architecture, design principles, and structural decisions.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [System Layers](#system-layers)
3. [Core Principles](#core-principles)
4. [Data Architecture](#data-architecture)
5. [Integration Architecture](#integration-architecture)
6. [Folder Hierarchy](#folder-hierarchy)
7. [Technology Stack](#technology-stack)
8. [Design Constraints](#design-constraints)

---

## Philosophy

LifeOS Enterprise is built on a single core belief: **a personal operating system should be as reliable, structured, and maintainable as enterprise software.**

The system treats every life domain — health, finance, projects, relationships, learning — as a first-class data domain with a consistent schema, review cadence, and automation surface.

Key philosophical pillars:

- **Single Source of Truth** — Every piece of information has exactly one canonical home.
- **Everything is a Note** — All objects (people, projects, goals, events) are Markdown notes with structured frontmatter.
- **Progressive Complexity** — The system works at a minimal level and scales with intentional investment.
- **Human-First** — The system serves the human, not the other way around. Friction is a design failure.

---

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                      AI OS Layer                        │
│         (AI prompts, synthesis, intelligent capture)    │
├─────────────────────────────────────────────────────────┤
│                  Automation Layer                       │
│         (scripts, templater, periodic tasks)            │
├─────────────────────────────────────────────────────────┤
│                   Dashboard Layer                       │
│         (Dataview queries, MOCs, command center)        │
├─────────────────────────────────────────────────────────┤
│                    Template Layer                       │
│         (note templates, capture forms, snippets)       │
├─────────────────────────────────────────────────────────┤
│                  Object Model Layer                     │
│         (typed notes, metadata schema, relations)       │
├─────────────────────────────────────────────────────────┤
│                 Folder Structure Layer                  │
│         (canonical hierarchy, naming conventions)       │
└─────────────────────────────────────────────────────────┘
```

Each layer depends only on the layers below it. This ensures the vault remains functional even if higher layers are incomplete or disabled.

---

## Core Principles

### 1. Typed Notes
Every note belongs to a defined **type** with a consistent frontmatter schema and placement in the folder hierarchy.

### 2. Consistent Metadata
All notes use YAML frontmatter. Schema conventions are defined in [docs/METADATA_SCHEMA.md](./docs/METADATA_SCHEMA.md).

### 3. Atomic Notes
Each note captures one concept, decision, event, or entity. Composition is achieved through links and Dataview queries, not by stuffing content into a single file.

### 4. Explicit Relationships
Relationships between notes (e.g., project → goal, task → project, person → meeting) are expressed as YAML frontmatter properties rather than inline wikilinks where precision matters.

### 5. Idempotent Automation
All scripts and automations must be safe to run multiple times without causing unintended side effects.

### 6. Reviewable System
Every major domain participates in a defined review cadence (daily, weekly, monthly, quarterly, annual). See [docs/REVIEW_SYSTEM.md](./docs/REVIEW_SYSTEM.md).

---

## Data Architecture

### Object Types

The system defines a fixed set of **first-class object types**. Each type has:
- A canonical folder location
- A required frontmatter schema
- A dedicated template
- Participation in at least one dashboard

See [docs/OBJECT_MODEL.md](./docs/OBJECT_MODEL.md) for the full list.

### Metadata Schema

All frontmatter properties follow naming and typing conventions defined in [docs/METADATA_SCHEMA.md](./docs/METADATA_SCHEMA.md).

### Linking Strategy

- **Wikilinks** (`[[Note]]`) are used for narrative, contextual references.
- **Frontmatter properties** are used for typed, queryable relationships.
- **Tags** are used for cross-cutting classification (e.g., `#area/health`, `#status/active`).

---

## Integration Architecture

### Plugin Stack
The system relies on a curated set of Obsidian community plugins. The stack is defined in [docs/PLUGIN_STACK.md](./docs/PLUGIN_STACK.md).

### AI Integration
AI capabilities are integrated as an OS-level layer described in [docs/AI_OS.md](./docs/AI_OS.md). AI is used for capture assistance, synthesis, review support, and intelligent search — not as a replacement for structured data.

### Automation
External and internal automation is described in [docs/AUTOMATION_SPEC.md](./docs/AUTOMATION_SPEC.md). Scripts live in the `scripts/` directory of this repository.

---

## Folder Hierarchy

The top-level vault folder structure is designed around **life domains** and **note types**. The full specification is in [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md).

High-level summary:

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

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Vault | Obsidian |
| Notes | Markdown + YAML frontmatter |
| Querying | Dataview |
| Templating | Templater |
| Automation | JavaScript (Templater), Python/Shell (external) |
| AI | To be defined — see [docs/AI_OS.md](./docs/AI_OS.md) |
| Sync | To be defined |
| Version Control | Git (this repository) |

---

## Design Constraints

1. **Markdown only** — No proprietary formats. All notes must be readable outside of Obsidian.
2. **No vendor lock-in** — Plugin choices prioritize portability. The system must be operable at reduced capability without any specific plugin.
3. **Performance** — Vault must remain responsive at 10,000+ notes. Dataview queries must be scoped and optimized.
4. **Privacy** — No sensitive data leaves the local machine without explicit user action.
5. **Maintainability** — Any contributor should be able to understand the system from the documentation alone.

---

## TODO

- [ ] Define the complete object type taxonomy
- [ ] Finalize plugin stack selection
- [ ] Define AI provider and integration method
- [ ] Define sync strategy (iCloud, Obsidian Sync, git, etc.)
- [ ] Create architecture decision records (ADRs) for major choices
