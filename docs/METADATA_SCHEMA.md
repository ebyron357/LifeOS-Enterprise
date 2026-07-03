# LifeOS Enterprise — Metadata Schema

> Defines the YAML frontmatter schema standards for all note types in the LifeOS system.

---

## Overview

All notes in LifeOS Enterprise use YAML frontmatter for structured, queryable metadata. This document defines:

- The universal properties present on all note types
- The type-specific property schemas
- Data type conventions
- Naming conventions

---

## Conventions

### Property Naming

- All property names use `kebab-case`
- Boolean properties use the `is-` or `has-` prefix (e.g., `is-active`, `has-deadline`)
- Date properties use the `-date` suffix (e.g., `created-date`, `review-date`)
- Array properties use plural names (e.g., `tags`, `related-projects`)

### Data Types

| Type | Format | Example |
|------|--------|---------|
| String | Plain text | `"My Project"` |
| Date | `YYYY-MM-DD` | `2026-07-03` |
| Boolean | `true` / `false` | `true` |
| Number | Integer or decimal | `3` or `4.5` |
| Array | YAML list | `["tag1", "tag2"]` |
| Link | Obsidian wikilink | `"[[Note Name]]"` |
| Enum | Predefined string values | `"active"` |

### Null Handling

- Omit optional properties rather than setting them to `null` or empty string.
- Required properties must always be present.

---

## Universal Properties

These properties are present on **every** note type.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | Enum | ✅ | The object type (see OBJECT_MODEL.md) |
| `created-date` | Date | ✅ | Date the note was created |
| `modified-date` | Date | ✅ | Date the note was last modified |
| `tags` | Array | ✅ | Classification tags |
| `status` | Enum | ✅ | Note-level status (see below) |
| `title` | String | ✅ | Human-readable title |

### Universal Status Values

| Value | Meaning |
|-------|---------|
| `active` | Currently in use or in progress |
| `paused` | Temporarily on hold |
| `completed` | Done — outcome achieved |
| `archived` | No longer relevant, kept for reference |
| `draft` | In progress, not yet ready |

---

## Type-Specific Schemas

### `project`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `area` | Link | ✅ | Parent area |
| `outcome` | String | ✅ | Desired outcome statement |
| `start-date` | Date | ✅ | When work began |
| `target-date` | Date | ⬜ | Desired completion date |
| `completed-date` | Date | ⬜ | Actual completion date |
| `next-action` | String | ⬜ | The current next action |
| `goals` | Array(Link) | ⬜ | Related goals |
| `priority` | Enum | ⬜ | `high`, `medium`, `low` |

---

### `area`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `domain` | Enum | ✅ | Life domain category |
| `purpose` | String | ✅ | Why this area exists |
| `review-cadence` | Enum | ✅ | `weekly`, `monthly`, `quarterly` |
| `last-review-date` | Date | ⬜ | Last review date |

**Domain values:** `work`, `health`, `finance`, `relationships`, `learning`, `personal`, `home`

---

### `person`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `relationship-type` | Enum | ✅ | `professional`, `personal`, `family` |
| `organization` | String | ⬜ | Current org/company |
| `last-contact-date` | Date | ⬜ | Most recent interaction |
| `contact-cadence` | Enum | ⬜ | Desired contact frequency |
| `email` | String | ⬜ | Email address |

---

### `meeting`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `date` | Date | ✅ | Meeting date |
| `attendees` | Array(Link) | ✅ | People present |
| `meeting-type` | Enum | ✅ | `1-1`, `team`, `interview`, `call`, `other` |
| `project` | Link | ⬜ | Related project |
| `action-items` | Array | ⬜ | Action items captured |

---

### `goal`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `area` | Link | ✅ | Parent area |
| `outcome` | String | ✅ | Desired outcome |
| `target-date` | Date | ✅ | When to achieve by |
| `key-results` | Array | ⬜ | Measurable milestones |
| `review-date` | Date | ⬜ | Next review date |
| `progress` | Number | ⬜ | Progress percentage (0–100) |

---

### `daily-note`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `date` | Date | ✅ | The day this note covers |
| `energy` | Enum | ⬜ | `high`, `medium`, `low` |
| `mood` | Enum | ⬜ | `great`, `good`, `neutral`, `low`, `difficult` |
| `gratitude` | Array | ⬜ | Gratitude items |
| `intention` | String | ⬜ | Day's main intention |

---

## Tag Taxonomy

Tags follow a hierarchical format: `#category/subcategory`

| Namespace | Examples | Purpose |
|-----------|---------|---------|
| `#area/` | `#area/health`, `#area/finance` | Life domain |
| `#status/` | `#status/active`, `#status/archived` | Lifecycle state |
| `#type/` | `#type/reference`, `#type/project` | Note type (redundant with `type` field, for search) |
| `#priority/` | `#priority/high`, `#priority/low` | Urgency and importance |
| `#review/` | `#review/weekly`, `#review/monthly` | Review cadence |

---

## TODO

- [ ] Finalize schemas for all object types (book, course, habit, decision, reference, moc)
- [ ] Define JSON Schema files for automated validation
- [ ] Define which properties are indexed by Dataview for performance
- [ ] Document deprecated properties and migration path
- [ ] Create frontmatter linting configuration
