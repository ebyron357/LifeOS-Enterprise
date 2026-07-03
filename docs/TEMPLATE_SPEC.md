# LifeOS Enterprise — Template Specification

> Defines the design standards, structure, and conventions for all note templates.

---

## Overview

Templates are pre-structured Markdown files that scaffold new notes of a specific type. They ensure consistency across all notes of the same type and reduce friction when creating new content.

This document defines:
- Template design principles
- Required and optional sections for each template type
- Templater syntax conventions
- Template maintenance guidelines

---

## Design Principles

### 1. Minimal Required Input
Templates should require as little manual input as possible at creation time. Dynamic fields (date, title) are populated automatically by Templater.

### 2. Guided Structure
Each template includes section headers and brief placeholder text explaining what belongs in each section. These prompts are removed when content is added.

### 3. Consistent Frontmatter
Every template opens with a YAML frontmatter block. The schema matches the definitions in [METADATA_SCHEMA.md](./METADATA_SCHEMA.md).

### 4. Progressive Disclosure
Templates show only what is needed for immediate use. Optional sections can be collapsed or omitted until relevant.

### 5. No Query Code in Templates
Templates contain no Dataview queries. Queries belong exclusively in dashboard notes.

---

## Template Inventory

> **Status:** Placeholder — templates will be built in Phase 2.

| Template Name | Object Type | Priority |
|--------------|-------------|---------|
| `Daily-Note.md` | `daily-note` | P0 |
| `Weekly-Review.md` | review | P0 |
| `Monthly-Review.md` | review | P0 |
| `Quarterly-Review.md` | review | P1 |
| `Annual-Review.md` | review | P1 |
| `Project.md` | `project` | P0 |
| `Area.md` | `area` | P0 |
| `Person.md` | `person` | P1 |
| `Meeting.md` | `meeting` | P1 |
| `Goal.md` | `goal` | P0 |
| `Habit.md` | `habit` | P1 |
| `Book.md` | `book` | P2 |
| `Course.md` | `course` | P2 |
| `Decision.md` | `decision` | P1 |
| `Reference.md` | `reference` | P2 |
| `MOC.md` | `moc` | P1 |

---

## Template Structure Standard

Every template follows this structure:

```
---
[YAML frontmatter]
---

# {{title}}

[Optional: brief description or purpose section]

---

## [Section 1]

[Content or placeholder]

## [Section 2]

[Content or placeholder]

---
*Template: [Template Name] | Created: {{date}}*
```

---

## Frontmatter Requirements

Each template's frontmatter must include all **required** properties from [METADATA_SCHEMA.md](./METADATA_SCHEMA.md) for the corresponding type, with Templater expressions for dynamic values.

Example (Daily Note):
```yaml
---
type: daily-note
title: "{{date:YYYY-MM-DD}}"
created-date: {{date:YYYY-MM-DD}}
modified-date: {{date:YYYY-MM-DD}}
tags: []
status: active
date: {{date:YYYY-MM-DD}}
---
```

---

## Templater Conventions

> **Note:** Specific Templater syntax implementation is deferred to Phase 2. The following are design intentions only.

- Use `{{date:FORMAT}}` for date fields
- Use `{{title}}` for the note title (prompted on creation for most types)
- Use conditional blocks for optional sections that depend on user input
- Avoid complex logic in templates — if logic is needed, delegate to a Templater script

---

## Template Sections by Type

### Daily Note Template Sections
1. Frontmatter
2. Morning: Intention + Priorities
3. Schedule (optional)
4. Journal / Reflections
5. Evening: Wins + Gratitude
6. Notes / Captures

### Project Template Sections
1. Frontmatter
2. Outcome Statement
3. Background / Context
4. Key Milestones
5. Resources & References
6. Log / Updates

### Weekly Review Template Sections
1. Frontmatter
2. Last Week: Wins, Misses, Lessons
3. Projects: Status check for each active project
4. Goals: Progress check
5. Inbox: Clear and process
6. Next Week: Top priorities and intentions

---

## TODO

- [ ] Build all P0 templates in Phase 2
- [ ] Define Templater script architecture for complex templates
- [ ] Create a template testing checklist
- [ ] Document how templates are installed in a new vault
- [ ] Define template versioning strategy
