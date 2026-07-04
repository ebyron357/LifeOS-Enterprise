# LifeOS Enterprise — Metadata Schema

> The authoritative specification for all YAML frontmatter in the LifeOS system. Every property name, data type, allowed value, validation rule, and schema for all 21 object types is defined here. When there is a conflict between this document and any other document, this document governs metadata.

---

## Table of Contents

1. [Overview](#overview)
2. [Part I — Naming Rules](#part-i--naming-rules)
3. [Part II — Data Types](#part-ii--data-types)
4. [Part III — Universal Properties](#part-iii--universal-properties)
5. [Part IV — Status Model](#part-iv--status-model)
6. [Part V — Priority Model](#part-v--priority-model)
7. [Part VI — Review Fields](#part-vi--review-fields)
8. [Part VII — Relationship Fields](#part-vii--relationship-fields)
9. [Part VIII — Type-Specific Schemas](#part-viii--type-specific-schemas)
10. [Part IX — Tag Taxonomy](#part-ix--tag-taxonomy)
11. [Part X — Validation Rules](#part-x--validation-rules)

---

## Overview

All notes in LifeOS Enterprise use YAML frontmatter as the sole mechanism for structured, queryable, relational metadata. The frontmatter block is the contract between a note and the rest of the system.

**Design principles governing this specification:**

- **Every note has a type.** The `type` field is required on all notes and drives all downstream behavior.
- **Required fields are non-negotiable.** A note missing a required field is malformed.
- **Optional fields are omitted, not nulled.** Absent optional fields must be omitted entirely from the frontmatter, not set to `null`, `""`, or `[]`.
- **Enum values are case-sensitive and lowercase.** The value `Active` is invalid; `active` is valid.
- **This schema is the single source of truth for property names.** Do not invent property names outside this document.

---

## Part I — Naming Rules

### 1.1 Property Name Format

All frontmatter property keys follow `kebab-case`.

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Lowercase, hyphen-separated words | `target-date` | `targetDate`, `target_date`, `TargetDate` |
| No leading or trailing hyphens | `start-date` | `-start-date`, `start-date-` |
| No consecutive hyphens | `last-contact-date` | `last--contact--date` |
| Abbreviations stay lowercase | `url`, `ai-agent` | `URL`, `AI-Agent` |

### 1.2 Property Name Prefixes and Suffixes

Consistent affixes communicate intent at a glance.

| Convention | Applies To | Examples |
|------------|-----------|---------|
| `-date` suffix | All date properties | `created-date`, `target-date`, `review-date` |
| `-type` suffix | Enum properties that classify the object | `meeting-type`, `asset-type`, `document-type` |
| `is-` prefix | Boolean flags | `is-recurring`, `is-billable` |
| `has-` prefix | Boolean presence indicators | `has-deadline`, `has-attachment` |
| Plural form | Array properties | `tags`, `attendees`, `key-results`, `action-items` |
| `-cadence` suffix | Review or contact frequency enums | `review-cadence`, `contact-cadence` |
| `related-` prefix | Soft links to contextually related notes | `related-knowledge`, `related-projects` |

### 1.3 Note File Naming

| Context | Format | Example |
|---------|--------|---------|
| General notes | `Title Case.md` | `Weekly Review 2026-07-01.md` |
| Dated notes | `YYYY-MM-DD Description.md` | `2026-07-03 Client Kickoff Call.md` |
| Project folders | `Title-Case-With-Dashes/` | `Website-Redesign-2026/` |
| System/index notes | `_underscore-prefix.md` | `_project.md`, `_area.md` |
| Templates | `Type-Name.md` | `Daily-Note.md`, `Meeting.md` |

### 1.4 Enum Value Format

All enum values are `kebab-case` and lowercase.

| Correct | Incorrect |
|---------|-----------|
| `active` | `Active`, `ACTIVE` |
| `in-review` | `inReview`, `in_review`, `In Review` |
| `high` | `High`, `HIGH` |

---

## Part II — Data Types

Every property in this specification is typed. The following types are supported.

### 2.1 Type Reference

| Type | YAML Format | Valid Example | Invalid Example | Notes |
|------|------------|---------------|-----------------|-------|
| `String` | Unquoted or quoted plain text | `Launch newsletter` | — | Quote strings containing colons or special characters |
| `Date` | `YYYY-MM-DD` | `2026-07-03` | `07/03/2026`, `July 3 2026` | ISO 8601 only. No datetime — date only. |
| `Boolean` | `true` or `false` (unquoted) | `true` | `"true"`, `yes`, `1` | Must be unquoted YAML boolean |
| `Number` | Integer or decimal | `42`, `4.5` | `"42"`, `four` | No units in the field; document units in the property description |
| `Enum` | Predefined string value | `active` | `Active`, `ACTIVE` | Must exactly match an allowed value from this document |
| `Link` | Obsidian wikilink string | `"[[Project Name]]"` | `[[Project Name]]` (unquoted in YAML may parse incorrectly) | Always quote wikilinks in YAML |
| `Array(String)` | YAML list of strings | `["tag1", "tag2"]` or block list | `"tag1, tag2"` | Use YAML list syntax, not comma-separated strings |
| `Array(Link)` | YAML list of wikilink strings | `["[[Note A]]", "[[Note B]]"]` | — | Each element must be a valid quoted wikilink |
| `Array(Enum)` | YAML list of enum values | `["high", "medium"]` | — | Each element must be a valid enum value |
| `URL` | Plain string starting with `http://` or `https://` | `https://example.com` | `example.com` | Must include protocol prefix |

### 2.2 Absent vs. Null

| Case | Correct | Incorrect |
|------|---------|-----------|
| Optional field not applicable | Omit the field entirely | `field: null`, `field: ""`, `field: []` |
| Required field with no value yet | Must be filled — note is malformed if absent | — |

### 2.3 Multi-line Strings

For long string values (e.g., `outcome`, `rationale`, `description`), use YAML block scalar syntax:

```yaml
outcome: >
  The newsletter is live with 500 subscribers and a published
  issue cadence of weekly on Thursdays.
```

---

## Part III — Universal Properties

These six properties are **required on every note** regardless of type. No exceptions.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | Enum | ✅ | Object type — must be one of the 21 types defined in [OBJECT_MODEL.md](./OBJECT_MODEL.md) |
| `title` | String | ✅ | Human-readable name of this note. Must be unique within its type. |
| `status` | Enum | ✅ | Lifecycle state — must be a value valid for this object's type (see Part IV) |
| `created-date` | Date | ✅ | Date the note was first created (`YYYY-MM-DD`) |
| `modified-date` | Date | ✅ | Date the note was last meaningfully edited (`YYYY-MM-DD`) |
| `tags` | Array(String) | ✅ | At minimum one `#type/` tag matching the object type. See Part IX. |

### 3.1 Universal Frontmatter Block

Every note begins with this frontmatter skeleton before type-specific fields are added:

```yaml
---
type: <object-type>
title: "<Note Title>"
status: <status-value>
created-date: YYYY-MM-DD
modified-date: YYYY-MM-DD
tags:
  - "#type/<object-type>"
  - "#area/<domain>"
---
```

### 3.2 Universal Property Validation

| Rule | Description |
|------|-------------|
| `type` must be a registered type | Value must appear in the Object Type Registry in OBJECT_MODEL.md |
| `title` must be non-empty | An empty string is invalid |
| `status` must be valid for the type | See the per-type status constraints in Part IV |
| `created-date` must not be in the future | A note cannot be created in the future |
| `modified-date` ≥ `created-date` | Modification date must be on or after creation date |
| `tags` must contain at least one entry | An empty tags array is invalid |

---

## Part IV — Status Model

### 4.1 Universal Status Values

These values are the allowed set. Not every value is valid for every type — constraints are defined in the per-type table below.

| Value | Meaning | Terminal? |
|-------|---------|-----------|
| `draft` | Created but not yet in active use | No |
| `active` | Currently in use, in progress, or being maintained | No |
| `paused` | Temporarily suspended with intent to resume | No |
| `completed` | Outcome achieved — work is done | Yes (soft) |
| `abandoned` | Discontinued without completing the intended outcome | Yes (soft) |
| `archived` | Retained for historical reference; no longer active | Yes |
| `deprecated` | Superseded by a newer version; retained for reference | Yes (soft) |
| `expired` | Passed its valid date with no renewal | Yes (soft) |
| `superseded` | Replaced by a newer document or record | Yes (soft) |
| `mitigated` | Risk resolved through preventive action | Yes (soft) |
| `materialized` | Risk has occurred | Yes (soft) |
| `pursuing` | Opportunity is being actively pursued | No |
| `declined` | Opportunity was evaluated and not pursued | Yes (soft) |

"Terminal (soft)" means the note is at rest but not yet archived. It will eventually move to `archived`.

### 4.2 Per-Type Valid Status Values

| Type | Valid Status Values |
|------|---------------------|
| `area` | `active`, `paused`, `archived` |
| `business` | `active`, `paused`, `archived` |
| `project` | `draft`, `active`, `paused`, `completed`, `abandoned`, `archived` |
| `task` | `draft`, `active`, `completed`, `archived` |
| `goal` | `draft`, `active`, `completed`, `abandoned`, `archived` |
| `knowledge` | `draft`, `active`, `archived` |
| `decision` | `active`, `archived` |
| `meeting` | `draft`, `completed`, `archived` |
| `risk` | `active`, `mitigated`, `materialized`, `expired`, `archived` |
| `opportunity` | `draft`, `active`, `pursuing`, `declined`, `archived` |
| `asset` | `active`, `archived` |
| `tool` | `active`, `paused`, `archived` |
| `automation` | `draft`, `active`, `paused`, `archived` |
| `workflow` | `draft`, `active`, `paused`, `archived` |
| `prompt` | `draft`, `active`, `deprecated`, `archived` |
| `ai-agent` | `draft`, `active`, `deprecated`, `archived` |
| `person` | `active`, `paused`, `archived` |
| `company` | `active`, `archived` |
| `document` | `draft`, `active`, `expired`, `superseded`, `archived` |
| `template` | `draft`, `active`, `deprecated`, `archived` |
| `resource` | `draft`, `active`, `archived` |

### 4.3 Status Transition Rules

1. Notes move **forward** through their lifecycle. Reverting from `completed` to `active` requires explicit justification noted in the body.
2. `archived` is the final resting state for all types. Once archived, a note is not edited.
3. Any note reaching a terminal soft-state (`completed`, `abandoned`, `deprecated`, `expired`, `superseded`, `mitigated`, `materialized`, `declined`) should be transitioned to `archived` within 90 days.
4. `draft` notes must not appear in dashboards or active queries. They are excluded by default from all Dataview queries.

---

## Part V — Priority Model

Priority is an optional field available on `project`, `task`, `goal`, `risk`, and `opportunity`. It is not used on relationship or reference types.

### 5.1 Priority Values

| Value | Meaning | When to Use |
|-------|---------|-------------|
| `critical` | Must be addressed immediately; blocking | Outages, hard deadlines, health/safety |
| `high` | Important and time-sensitive | Core objectives for the current cycle |
| `medium` | Important but not urgent | Supporting work, planned improvements |
| `low` | Nice to have; do when capacity allows | Someday/maybe items, backlog |

### 5.2 Priority Property

```yaml
priority: high   # critical | high | medium | low
```

### 5.3 Priority Rules

1. `priority` is **optional** — omitting it implies `medium`.
2. Only one priority value per note — not an array.
3. `critical` should be rare. If everything is `critical`, nothing is.
4. Priority is re-evaluated at minimum weekly for `active` projects and tasks.

---

## Part VI — Review Fields

Review fields are a standardized set of properties that govern when and how a note is reviewed. They are used across multiple object types wherever a review cadence applies.

### 6.1 Review Field Definitions

| Property | Type | Description |
|----------|------|-------------|
| `review-cadence` | Enum | How frequently this note should be reviewed |
| `last-review-date` | Date | Date the most recent review was completed |
| `next-review-date` | Date | Date the next review is scheduled |
| `review-status` | Enum | State of the current review cycle |

### 6.2 `review-cadence` Allowed Values

| Value | Frequency | Typically Used On |
|-------|-----------|-------------------|
| `daily` | Every day | `daily-note` (implicit) |
| `weekly` | Once per week | `project`, high-priority `goal` |
| `monthly` | Once per month | `area`, `goal`, `business` |
| `quarterly` | Once per quarter | `area`, `goal`, long-horizon `project` |
| `annually` | Once per year | `area` (strategic), `asset` |
| `as-needed` | No fixed cadence | `knowledge`, `resource`, `decision` |

### 6.3 `review-status` Allowed Values

| Value | Meaning |
|-------|---------|
| `current` | Review is up to date |
| `due` | Review is due now |
| `overdue` | Review is past due |
| `scheduled` | Review is planned with a confirmed date |

### 6.4 Review Fields by Type

| Type | `review-cadence` | `last-review-date` | `next-review-date` | `review-status` |
|------|-----------------|-------------------|-------------------|-----------------|
| `area` | ✅ Required | ⬜ Optional | ⬜ Optional | ⬜ Optional |
| `business` | ⬜ Optional | ⬜ Optional | ⬜ Optional | ⬜ Optional |
| `project` | ⬜ Optional | ⬜ Optional | ⬜ Optional | ⬜ Optional |
| `goal` | ⬜ Optional | ⬜ Optional | ✅ Required | ⬜ Optional |
| `decision` | — | ⬜ Optional | ⬜ Optional (`review-date`) | — |
| `risk` | — | — | ⬜ Optional (`review-date`) | — |
| `knowledge` | — | ⬜ Optional (`last-reviewed-date`) | — | — |
| `asset` | — | ⬜ Optional (`last-valued-date`) | — | — |
| `tool` | — | ⬜ Optional (`last-evaluated-date`) | — | — |
| `automation` | — | ⬜ Optional (`last-run-date`) | — | — |
| `workflow` | — | ⬜ Optional (`last-run-date`) | — | — |
| `prompt` | — | ⬜ Optional (`last-tested-date`) | — | — |

---

## Part VII — Relationship Fields

Relationship fields encode typed, queryable links between notes. They are frontmatter properties, not inline wikilinks. This section defines the naming convention, the typing rules, and which fields are used on which object types.

### 7.1 Relationship Field Naming Convention

| Pattern | Purpose | Example Property |
|---------|---------|-----------------|
| `<type>` (singular) | Belongs-to / parent relationship | `area`, `project`, `business` |
| `<type>s` (plural) | Has-many / association | `goals`, `attendees`, `prompts` |
| `related-<type>s` | Soft association (non-hierarchical) | `related-knowledge`, `related-projects` |
| `<role>` (named role) | Person in a specific role | `owner`, `primary-contact`, `assigned-to` |

### 7.2 Relationship Field Types

| Field Type | Value Type | Example |
|------------|-----------|---------|
| Single parent link | `Link` | `area: "[[Health]]"` |
| Multiple associations | `Array(Link)` | `goals: ["[[Run Marathon]]", "[[Lose 10 lbs]]"]` |
| Named role | `Link` | `owner: "[[Jane Smith]]"` |
| External company | `Link` | `company: "[[Acme Corp]]"` |

### 7.3 Relationship Fields by Type

| Type | Relationship Fields |
|------|---------------------|
| `area` | — (root-level object) |
| `business` | `area` (Link), `related-company` (Link), `goals` (Array(Link)) |
| `project` | `area` (Link), `goals` (Array(Link)), `business` (Link) |
| `task` | `project` (Link), `area` (Link), `depends-on` (Array(Link)), `assigned-to` (Link) |
| `goal` | `area` (Link), `business` (Link) |
| `knowledge` | `source` (Link), `applies-to` (Array(Link)), `related-knowledge` (Array(Link)) |
| `decision` | `area` (Link), `project` (Link) |
| `meeting` | `attendees` (Array(Link)), `project` (Link), `area` (Link), `company` (Link), `decisions-made` (Array(Link)) |
| `risk` | `project` (Link), `goal` (Link), `business` (Link), `owner` (Link) |
| `opportunity` | `area` (Link), `business` (Link), `related-decision` (Link) |
| `asset` | `area` (Link), `business` (Link) |
| `tool` | `area` (Link), `replaces` (Link) |
| `automation` | `tool` (Link), `area` (Link), `workflow` (Link) |
| `workflow` | `area` (Link), `tools-required` (Array(Link)), `automations-used` (Array(Link)) |
| `prompt` | `ai-agent` (Link), `area` (Link) |
| `ai-agent` | `prompts` (Array(Link)), `tools-used` (Array(Link)), `area` (Link) |
| `person` | `organization` (Link or String) |
| `company` | `primary-contact` (Link), `area` (Link), `related-business` (Link) |
| `document` | `area` (Link), `project` (Link), `business` (Link), `parties` (Array(Link or String)) |
| `template` | — |
| `resource` | `area` (Link), `related-knowledge` (Array(Link)) |

### 7.4 Relationship Validation Rules

1. Every `Link` value must be a quoted wikilink: `"[[Note Title]]"`.
2. A link must reference a note of the correct type (e.g., `area` must link to a note with `type: area`).
3. A note must not link to itself.
4. A `depends-on` chain must not form a cycle.
5. `Array(Link)` fields must not contain duplicate entries.

---

## Part VIII — Type-Specific Schemas

Each schema table below lists all properties for that type. Universal properties (`type`, `title`, `status`, `created-date`, `modified-date`, `tags`) are not repeated — they are always present.

Legend: ✅ Required · ⬜ Optional

---

### `area`

**Canonical folder:** `02-Areas/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `domain` | Enum | ✅ | `work`, `health`, `finance`, `relationships`, `learning`, `personal`, `home` | Life domain this area represents |
| `purpose` | String | ✅ | Non-empty string | One sentence: why this area exists |
| `review-cadence` | Enum | ✅ | `weekly`, `monthly`, `quarterly`, `annually` | How often this area is formally reviewed |
| `current-priority` | Enum | ⬜ | `critical`, `high`, `medium`, `low` | Current relative priority of this area |
| `last-review-date` | Date | ⬜ | `YYYY-MM-DD` | Date of the most recent area review |
| `next-review-date` | Date | ⬜ | `YYYY-MM-DD` | Date of the next scheduled review |

**Example:**
```yaml
---
type: area
title: Health
status: active
created-date: 2026-01-01
modified-date: 2026-07-01
tags:
  - "#type/area"
  - "#area/health"
domain: health
purpose: Maintain physical health, energy, and longevity as the foundation for all other areas.
review-cadence: weekly
current-priority: high
last-review-date: 2026-06-29
next-review-date: 2026-07-06
---
```

---

### `business`

**Canonical folder:** `02-Areas/Work/Businesses/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `business-type` | Enum | ✅ | `owned`, `client`, `employer`, `partner`, `investee` | Relationship to this business |
| `industry` | String | ✅ | Non-empty string | Industry or sector |
| `stage` | Enum | ✅ | `idea`, `pre-revenue`, `active`, `scaling`, `exiting`, `closed` | Current stage of the business |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Parent area (typically Work) |
| `legal-entity` | String | ⬜ | Non-empty string | Legal structure (LLC, S-Corp, etc.) |
| `founding-date` | Date | ⬜ | `YYYY-MM-DD` | Date the business was founded |
| `website` | URL | ⬜ | `https://...` | Primary website |
| `related-company` | Link | ⬜ | `"[[Company Name]]"` | Link to `company` note, if externally incorporated |
| `goals` | Array(Link) | ⬜ | `["[[Goal Name]]"]` | Strategic goals for this business |
| `review-cadence` | Enum | ⬜ | `weekly`, `monthly`, `quarterly` | Business review frequency |
| `last-review-date` | Date | ⬜ | `YYYY-MM-DD` | Date of last business review |

**Example:**
```yaml
---
type: business
title: Acme Consulting LLC
status: active
created-date: 2026-01-15
modified-date: 2026-07-01
tags:
  - "#type/business"
  - "#area/work"
business-type: owned
industry: Management Consulting
stage: active
area: "[[Work]]"
legal-entity: LLC
founding-date: 2024-03-01
website: https://acmeconsulting.com
review-cadence: monthly
---
```

---

### `project`

**Canonical folder:** `01-Projects/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `area` | Link | ✅ | `"[[Area Name]]"` | Parent area |
| `outcome` | String | ✅ | Non-empty string | Concrete end state — what "done" looks like |
| `start-date` | Date | ✅ | `YYYY-MM-DD` | Date work began |
| `priority` | Enum | ⬜ | `critical`, `high`, `medium`, `low` | Current priority |
| `target-date` | Date | ⬜ | `YYYY-MM-DD` | Desired completion date |
| `completed-date` | Date | ⬜ | `YYYY-MM-DD` | Actual completion date |
| `next-action` | String | ⬜ | Non-empty string | The single next physical action |
| `goals` | Array(Link) | ⬜ | `["[[Goal Name]]"]` | Goals this project advances |
| `business` | Link | ⬜ | `"[[Business Name]]"` | Related business |
| `review-cadence` | Enum | ⬜ | `weekly`, `monthly` | How often this project is reviewed |
| `last-review-date` | Date | ⬜ | `YYYY-MM-DD` | Date of last project review |

**Example:**
```yaml
---
type: project
title: Launch Newsletter
status: active
created-date: 2026-06-01
modified-date: 2026-07-03
tags:
  - "#type/project"
  - "#area/work"
  - "#priority/high"
area: "[[Work]]"
outcome: First newsletter issue published with 100+ subscribers by 2026-09-01.
start-date: 2026-06-01
target-date: 2026-09-01
priority: high
next-action: Write first draft of issue 1
goals: ["[[Grow Audience to 1000 by 2027]]"]
review-cadence: weekly
---
```

---

### `task`

**Canonical folder:** `01-Projects/[Project]/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `project` | Link | ✅ | `"[[Project Name]]"` | Parent project |
| `area` | Link | ✅ | `"[[Area Name]]"` | Parent area (inherited from project) |
| `priority` | Enum | ⬜ | `critical`, `high`, `medium`, `low` | Task priority |
| `due-date` | Date | ⬜ | `YYYY-MM-DD` | Date this task must be completed by |
| `completed-date` | Date | ⬜ | `YYYY-MM-DD` | Actual completion date |
| `effort` | Enum | ⬜ | `small`, `medium`, `large` | Estimated effort level |
| `depends-on` | Array(Link) | ⬜ | `["[[Task Name]]"]` | Tasks that must complete before this one |
| `assigned-to` | Link | ⬜ | `"[[Person Name]]"` | Person responsible if delegated |

**Example:**
```yaml
---
type: task
title: Write first draft of newsletter issue 1
status: active
created-date: 2026-07-01
modified-date: 2026-07-03
tags:
  - "#type/task"
  - "#area/work"
  - "#priority/high"
project: "[[Launch Newsletter]]"
area: "[[Work]]"
priority: high
due-date: 2026-07-10
effort: medium
---
```

---

### `goal`

**Canonical folder:** `02-Areas/Goals/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `area` | Link | ✅ | `"[[Area Name]]"` | Parent area |
| `outcome` | String | ✅ | Non-empty string | Specific, observable end state |
| `target-date` | Date | ✅ | `YYYY-MM-DD` | Date by which to achieve this goal |
| `priority` | Enum | ⬜ | `critical`, `high`, `medium`, `low` | Goal priority |
| `horizon` | Enum | ⬜ | `90-day`, `annual`, `3-year`, `10-year` | Planning horizon |
| `key-results` | Array(String) | ⬜ | `["KR text"]` | Measurable milestones indicating progress |
| `progress` | Number | ⬜ | 0–100 (integer) | Estimated completion percentage |
| `next-review-date` | Date | ✅ | `YYYY-MM-DD` | Next scheduled review of this goal |
| `last-review-date` | Date | ⬜ | `YYYY-MM-DD` | Date of most recent review |
| `business` | Link | ⬜ | `"[[Business Name]]"` | Related business, if a business goal |
| `completed-date` | Date | ⬜ | `YYYY-MM-DD` | Date goal was achieved |

**Example:**
```yaml
---
type: goal
title: Run a marathon in under 4 hours
status: active
created-date: 2026-01-01
modified-date: 2026-07-01
tags:
  - "#type/goal"
  - "#area/health"
  - "#priority/high"
area: "[[Health]]"
outcome: Complete a marathon race in under 4 hours by 2027-03-15.
target-date: 2027-03-15
horizon: annual
priority: high
progress: 30
next-review-date: 2026-08-01
key-results:
  - Run a 10K in under 55 minutes by 2026-09-01
  - Complete a half marathon by 2026-12-01
  - Run 4 days per week consistently for 60 days
---
```

---

### `knowledge`

**Canonical folder:** `03-Resources/Knowledge/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `domain` | String | ✅ | Non-empty string (kebab-case preferred) | Subject discipline (e.g., `systems-thinking`, `finance`) |
| `confidence` | Enum | ⬜ | `low`, `medium`, `high` | Confidence in the accuracy of this insight |
| `source` | Link or String | ⬜ | `"[[Note Name]]"` or citation string | Origin of the insight |
| `related-knowledge` | Array(Link) | ⬜ | `["[[Knowledge Note]]"]` | Related `knowledge` notes |
| `applies-to` | Array(Link) | ⬜ | `["[[Area]]", "[[Project]]"]` | Areas, projects, or goals this applies to |
| `last-reviewed-date` | Date | ⬜ | `YYYY-MM-DD` | Date this note was last reviewed or updated |

**Example:**
```yaml
---
type: knowledge
title: Pareto Principle
status: active
created-date: 2026-03-10
modified-date: 2026-06-01
tags:
  - "#type/knowledge"
  - "#area/learning"
domain: systems-thinking
confidence: high
source: "[[The 80-20 Principle — Richard Koch]]"
related-knowledge: ["[[Second-Order Thinking]]", "[[Leverage Points]]"]
applies-to: ["[[Work]]", "[[Launch Newsletter]]"]
last-reviewed-date: 2026-06-01
---
```

---

### `decision`

**Canonical folder:** `06-Meta/Decisions/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `decision-date` | Date | ✅ | `YYYY-MM-DD` | Date the decision was made |
| `decision-statement` | String | ✅ | Declarative sentence beginning "Decided to…" | The decision in one sentence |
| `context` | String | ✅ | Non-empty string | Situation that required the decision |
| `rationale` | String | ✅ | Non-empty string | Why this option was chosen |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area this decision belongs to |
| `project` | Link | ⬜ | `"[[Project Name]]"` | Project this decision belongs to |
| `alternatives` | Array(String) | ⬜ | `["option text"]` | Options considered but not chosen |
| `expected-outcome` | String | ⬜ | Non-empty string | What is expected to result from this decision |
| `review-date` | Date | ⬜ | `YYYY-MM-DD` | Date to evaluate whether decision proved correct |
| `outcome-actual` | String | ⬜ | Non-empty string | What actually happened (filled in on review) |

**Example:**
```yaml
---
type: decision
title: Adopt Obsidian as the primary vault platform
status: active
created-date: 2026-01-10
modified-date: 2026-01-10
tags:
  - "#type/decision"
  - "#area/work"
decision-date: 2026-01-10
decision-statement: Decided to use Obsidian as the primary vault and knowledge management platform.
context: Evaluated four tools — Notion, Roam, Logseq, and Obsidian — for the LifeOS system.
rationale: Obsidian offers local-first storage, extensibility via plugins, and full Markdown portability.
alternatives:
  - Notion — rejected due to proprietary format and cloud-only storage
  - Roam — rejected due to cost and limited plugin ecosystem
  - Logseq — rejected due to less mature ecosystem
expected-outcome: A stable, portable knowledge system that remains functional without internet access.
review-date: 2027-01-10
---
```

---

### `meeting`

**Canonical folder:** `02-Areas/Relationships/Meetings/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `meeting-date` | Date | ✅ | `YYYY-MM-DD` | Date the meeting occurred |
| `meeting-type` | Enum | ✅ | `1-1`, `team`, `client`, `interview`, `call`, `workshop`, `other` | Type of meeting |
| `attendees` | Array(Link) | ✅ | `["[[Person Name]]"]` | Links to `person` notes |
| `duration-minutes` | Number | ⬜ | Positive integer | Length of the meeting in minutes |
| `project` | Link | ⬜ | `"[[Project Name]]"` | Related project |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Related area if not project-specific |
| `company` | Link | ⬜ | `"[[Company Name]]"` | Related company |
| `action-items` | Array(String) | ⬜ | `["[Owner]: action text"]` | Committed actions |
| `decisions-made` | Array(Link) | ⬜ | `["[[Decision Note]]"]` | Decisions produced by this meeting |

**Example:**
```yaml
---
type: meeting
title: 2026-07-03 Client Kickoff — Acme Corp
status: completed
created-date: 2026-07-03
modified-date: 2026-07-03
tags:
  - "#type/meeting"
  - "#area/work"
meeting-date: 2026-07-03
meeting-type: client
attendees: ["[[Jane Smith]]", "[[Bob Jones]]"]
duration-minutes: 60
project: "[[Acme Corp Website Redesign]]"
company: "[[Acme Corp]]"
action-items:
  - "[Me]: Send project brief by 2026-07-05"
  - "[Jane Smith]: Confirm stakeholder list by 2026-07-07"
decisions-made: ["[[Decided to start with discovery phase]]"]
---
```

---

### `risk`

**Canonical folder:** `06-Meta/Risks/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `risk-statement` | String | ✅ | "If X, then Y" format | The risk in one sentence |
| `likelihood` | Enum | ✅ | `low`, `medium`, `high` | Probability of occurrence |
| `impact` | Enum | ✅ | `low`, `medium`, `high`, `critical` | Severity if risk occurs |
| `project` | Link | ⬜ | `"[[Project Name]]"` | Project this risk threatens |
| `goal` | Link | ⬜ | `"[[Goal Name]]"` | Goal this risk threatens |
| `business` | Link | ⬜ | `"[[Business Name]]"` | Business this risk applies to |
| `owner` | Link | ⬜ | `"[[Person Name]]"` | Person monitoring this risk |
| `mitigation` | String | ⬜ | Non-empty string | Actions to reduce likelihood or impact |
| `contingency` | String | ⬜ | Non-empty string | Response plan if risk materializes |
| `review-date` | Date | ⬜ | `YYYY-MM-DD` | Next scheduled review of this risk |

**Example:**
```yaml
---
type: risk
title: Key contractor unavailability — Website Redesign
status: active
created-date: 2026-07-01
modified-date: 2026-07-01
tags:
  - "#type/risk"
  - "#area/work"
risk-statement: If the lead contractor becomes unavailable, the project timeline will slip by 6 weeks.
likelihood: medium
impact: high
project: "[[Acme Corp Website Redesign]]"
owner: "[[Jane Smith]]"
mitigation: Identify a backup contractor and share project documentation for fast handover.
contingency: Engage backup contractor immediately; communicate revised timeline to client within 24 hours.
review-date: 2026-08-01
---
```

---

### `opportunity`

**Canonical folder:** `06-Meta/Opportunities/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `opportunity-type` | Enum | ✅ | `business`, `career`, `investment`, `partnership`, `learning`, `personal`, `other` | Category |
| `description` | String | ✅ | Non-empty string | What the opportunity is and why it matters |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area most relevant to this opportunity |
| `business` | Link | ⬜ | `"[[Business Name]]"` | Related business |
| `potential-upside` | String | ⬜ | Non-empty string | What could be gained if pursued |
| `cost-or-risk` | String | ⬜ | Non-empty string | Cost or risk of pursuing |
| `decision-deadline` | Date | ⬜ | `YYYY-MM-DD` | Date by which a go/no-go decision must be made |
| `source` | String | ⬜ | Non-empty string | Where this opportunity originated |
| `related-decision` | Link | ⬜ | `"[[Decision Note]]"` | Decision note if evaluated |
| `priority` | Enum | ⬜ | `critical`, `high`, `medium`, `low` | Priority relative to other opportunities |

**Example:**
```yaml
---
type: opportunity
title: Speaking slot at ProductCon 2026
status: active
created-date: 2026-06-20
modified-date: 2026-06-20
tags:
  - "#type/opportunity"
  - "#area/work"
opportunity-type: career
description: Invited to submit a talk proposal for ProductCon 2026. 500-person audience, target demographic.
area: "[[Work]]"
potential-upside: Brand visibility, speaking credential, 500 potential new audience members.
cost-or-risk: 2 days of prep time; requires travel to Chicago.
decision-deadline: 2026-07-15
source: Conference organizer outreach via LinkedIn
priority: medium
---
```

---

### `asset`

**Canonical folder:** `02-Areas/Finance/Assets/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `asset-type` | Enum | ✅ | `financial`, `physical`, `digital`, `intellectual`, `real-estate`, `vehicle`, `equipment` | Asset category |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Parent area |
| `business` | Link | ⬜ | `"[[Business Name]]"` | Business this asset belongs to |
| `estimated-value` | Number | ⬜ | Non-negative decimal | Current estimated value (in base currency) |
| `acquisition-date` | Date | ⬜ | `YYYY-MM-DD` | Date of acquisition |
| `acquisition-cost` | Number | ⬜ | Non-negative decimal | Original purchase cost |
| `location` | String | ⬜ | Non-empty string | Physical location or account/platform |
| `depreciation-rate` | Number | ⬜ | 0–100 | Annual depreciation percentage |
| `insurance-policy` | String | ⬜ | Non-empty string | Policy reference if insured |
| `last-valued-date` | Date | ⬜ | `YYYY-MM-DD` | Date of most recent value assessment |

**Example:**
```yaml
---
type: asset
title: MacBook Pro 16" M3
status: active
created-date: 2026-01-20
modified-date: 2026-07-01
tags:
  - "#type/asset"
  - "#area/work"
asset-type: equipment
area: "[[Work]]"
estimated-value: 2800
acquisition-date: 2024-01-20
acquisition-cost: 3499
location: Home office
depreciation-rate: 25
last-valued-date: 2026-07-01
---
```

---

### `tool`

**Canonical folder:** `03-Resources/Tools/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `tool-type` | Enum | ✅ | `software`, `hardware`, `service`, `plugin`, `browser-extension`, `cli`, `other` | Tool category |
| `purpose` | String | ✅ | Non-empty string | What this tool does in the system |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Primary area this tool serves |
| `url` | URL | ⬜ | `https://...` | Primary URL or download link |
| `cost` | String | ⬜ | Free-text string | Pricing description (e.g., `free`, `$12/month`) |
| `version` | String | ⬜ | Non-empty string | Current version in use |
| `replaces` | Link | ⬜ | `"[[Tool Name]]"` | Tool this replaced |
| `alternatives` | Array(String) | ⬜ | `["tool name"]` | Alternative tools considered |
| `last-evaluated-date` | Date | ⬜ | `YYYY-MM-DD` | Date this tool was last deliberately evaluated |

**Example:**
```yaml
---
type: tool
title: Obsidian
status: active
created-date: 2026-01-01
modified-date: 2026-07-01
tags:
  - "#type/tool"
  - "#area/work"
tool-type: software
purpose: Primary vault, note-taking, and knowledge management platform.
url: https://obsidian.md
cost: free (plus optional Sync at $8/month)
version: "1.6.7"
alternatives:
  - Notion
  - Roam Research
  - Logseq
last-evaluated-date: 2026-01-10
---
```

---

### `automation`

**Canonical folder:** `03-Resources/Automations/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `automation-type` | Enum | ✅ | `templater`, `script`, `scheduled-job`, `webhook`, `integration`, `other` | Automation category |
| `trigger` | String | ✅ | Non-empty string | What initiates this automation |
| `actions` | Array(String) | ✅ | `["action text"]` | Ordered list of actions performed |
| `output` | String | ✅ | Non-empty string | What is produced or changed |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area this automation serves |
| `tool` | Link | ⬜ | `"[[Tool Name]]"` | Primary tool running this automation |
| `workflow` | Link | ⬜ | `"[[Workflow Name]]"` | Parent workflow if part of one |
| `script-location` | String | ⬜ | File path or URL | Location of the script or code |
| `error-handling` | String | ⬜ | Non-empty string | What happens on failure |
| `last-run-date` | Date | ⬜ | `YYYY-MM-DD` | Date of most recent successful run |

**Example:**
```yaml
---
type: automation
title: Daily Note Auto-Creation
status: active
created-date: 2026-02-01
modified-date: 2026-07-01
tags:
  - "#type/automation"
  - "#area/work"
automation-type: templater
trigger: Periodic Notes plugin fires at 07:00 daily
actions:
  - Create new note from Daily-Note.md template
  - Populate date field with today's date
  - Pre-fill yesterday's incomplete tasks
output: A new daily note in 00-Inbox/Daily/ for the current date.
tool: "[[Templater]]"
script-location: templates/Daily-Note.md
error-handling: If file already exists, open existing file without overwriting.
---
```

---

### `workflow`

**Canonical folder:** `03-Resources/Workflows/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `purpose` | String | ✅ | Non-empty string | What this workflow accomplishes |
| `trigger` | String | ✅ | Non-empty string | When or why this workflow is initiated |
| `steps` | Array(String) | ✅ | `["step text"]` (≥ 2 items) | Ordered, numbered steps |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area this workflow serves |
| `estimated-duration` | String | ⬜ | Duration string (e.g., `45 minutes`) | Typical time to complete |
| `output` | String | ⬜ | Non-empty string | End state or product after completion |
| `tools-required` | Array(Link) | ⬜ | `["[[Tool Name]]"]` | Tools needed |
| `automations-used` | Array(Link) | ⬜ | `["[[Automation Name]]"]` | Automations embedded in this workflow |
| `version` | String | ⬜ | `MAJOR.MINOR` format | Version number |
| `last-run-date` | Date | ⬜ | `YYYY-MM-DD` | Date last executed |

**Example:**
```yaml
---
type: workflow
title: Weekly Review
status: active
created-date: 2026-01-01
modified-date: 2026-06-01
tags:
  - "#type/workflow"
  - "#area/work"
purpose: Close out the week, process all loose ends, and plan next week intentionally.
trigger: Every Sunday, or within 24 hours of week end.
area: "[[Work]]"
estimated-duration: 60 minutes
version: "2.1"
steps:
  - "1. Capture sweep — empty mind, all loose items into inbox"
  - "2. Process inbox — file or discard every item"
  - "3. Review last week's calendar for follow-ups"
  - "4. Review all active projects — confirm next action"
  - "5. Check goal progress"
  - "6. Plan next week's top 3 priorities"
  - "7. Log review note in 06-Meta/Reviews/Weekly/"
output: All active projects have a confirmed next action. Inbox is empty. Weekly review note filed.
tools-required: ["[[Obsidian]]"]
last-run-date: 2026-06-29
---
```

---

### `prompt`

**Canonical folder:** `03-Resources/Prompts/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `prompt-type` | Enum | ✅ | `synthesis`, `capture`, `review`, `generation`, `analysis`, `classification`, `other` | Prompt category |
| `model` | String | ✅ | Non-empty string (e.g., `gpt-4o`, `claude-3-5-sonnet`) | AI model this prompt targets |
| `purpose` | String | ✅ | Non-empty string | What output this prompt produces |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area this prompt supports |
| `ai-agent` | Link | ⬜ | `"[[Agent Name]]"` | AI agent this prompt belongs to |
| `input-variables` | Array(String) | ⬜ | `["{{variable_name}}"]` | Variables to substitute before use |
| `expected-output` | String | ⬜ | Non-empty string | Description of expected response format |
| `version` | String | ⬜ | `MAJOR.MINOR` format | Version number |
| `last-tested-date` | Date | ⬜ | `YYYY-MM-DD` | Date last validated with target model |

**Example:**
```yaml
---
type: prompt
title: Weekly Synthesis Prompt
status: active
created-date: 2026-03-01
modified-date: 2026-06-01
tags:
  - "#type/prompt"
  - "#area/work"
prompt-type: synthesis
model: gpt-4o
purpose: Summarize all notes created in the past 7 days and surface key themes and action items.
input-variables:
  - "{{notes_list}}"
  - "{{date_range}}"
expected-output: A structured summary with sections for themes, decisions, open questions, and next actions.
ai-agent: "[[LifeOS Weekly Synthesis Agent]]"
version: "1.2"
last-tested-date: 2026-06-15
---
```

---

### `ai-agent`

**Canonical folder:** `03-Resources/AI-Agents/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `model` | String | ✅ | Non-empty string | Primary AI model powering this agent |
| `role` | String | ✅ | Non-empty string | One-sentence description of the agent's function |
| `scope` | String | ✅ | Non-empty string | What this agent has access to and is responsible for |
| `instruction-set` | String | ✅ | Non-empty string (or "see note body") | Summary of system prompt (full text in body) |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Primary area this agent supports |
| `prompts` | Array(Link) | ⬜ | `["[[Prompt Name]]"]` | Associated `prompt` notes |
| `tools-used` | Array(Link) | ⬜ | `["[[Tool Name]]"]` | Tools or integrations this agent uses |
| `capabilities` | Array(String) | ⬜ | `["capability text"]` | List of things this agent can do |
| `limitations` | Array(String) | ⬜ | `["limitation text"]` | Known limitations |
| `version` | String | ⬜ | `MAJOR.MINOR` format | Version number |

**Example:**
```yaml
---
type: ai-agent
title: LifeOS Weekly Synthesis Agent
status: active
created-date: 2026-03-01
modified-date: 2026-06-01
tags:
  - "#type/ai-agent"
  - "#area/work"
model: gpt-4o
role: Synthesize all vault activity from the past 7 days and produce a structured weekly briefing.
scope: Read access to all notes modified in the past 7 days. No write access.
instruction-set: See note body for full system prompt.
prompts: ["[[Weekly Synthesis Prompt]]"]
capabilities:
  - Identify recurring themes across notes
  - Extract open questions and unresolved decisions
  - Surface stale projects lacking next actions
limitations:
  - Does not have access to notes older than 30 days
  - Cannot create or modify notes
version: "1.0"
---
```

---

### `person`

**Canonical folder:** `02-Areas/Relationships/People/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `relationship-type` | Enum | ✅ | `professional`, `personal`, `family`, `advisor`, `client`, `vendor` | Relationship category |
| `organization` | Link or String | ⬜ | `"[[Company Name]]"` or plain string | Employer or affiliation |
| `email` | String | ⬜ | Valid email format | Primary email |
| `phone` | String | ⬜ | Non-empty string | Primary phone number |
| `location` | String | ⬜ | Non-empty string | City, state/country |
| `last-contact-date` | Date | ⬜ | `YYYY-MM-DD` | Date of most recent interaction |
| `contact-cadence` | Enum | ⬜ | `weekly`, `monthly`, `quarterly`, `annually`, `as-needed` | Desired contact frequency |
| `met-date` | Date | ⬜ | `YYYY-MM-DD` | Date first met |
| `met-context` | String | ⬜ | Non-empty string | How or where the relationship began |
| `birthday` | String | ⬜ | `MM-DD` or `YYYY-MM-DD` | Birthday |

**Example:**
```yaml
---
type: person
title: Jane Smith
status: active
created-date: 2026-03-15
modified-date: 2026-07-01
tags:
  - "#type/person"
  - "#area/work"
relationship-type: client
organization: "[[Acme Corp]]"
email: jane.smith@acmecorp.com
location: "San Francisco, CA"
last-contact-date: 2026-07-03
contact-cadence: monthly
met-date: 2026-03-15
met-context: Introduced via mutual contact at ProductCon 2026.
---
```

---

### `company`

**Canonical folder:** `02-Areas/Relationships/Companies/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `company-type` | Enum | ✅ | `employer`, `client`, `vendor`, `partner`, `competitor`, `investee`, `other` | Relationship to this company |
| `industry` | String | ✅ | Non-empty string | Industry or sector |
| `website` | URL | ⬜ | `https://...` | Primary website |
| `location` | String | ⬜ | Non-empty string | Headquarters city and country |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area this relationship belongs to |
| `relationship-start-date` | Date | ⬜ | `YYYY-MM-DD` | When the relationship began |
| `primary-contact` | Link | ⬜ | `"[[Person Name]]"` | Primary contact at this company |
| `related-business` | Link | ⬜ | `"[[Business Name]]"` | User's business in formal relationship with this company |
| `notes` | String | ⬜ | Non-empty string | Key context about this company |

**Example:**
```yaml
---
type: company
title: Acme Corp
status: active
created-date: 2026-03-15
modified-date: 2026-07-01
tags:
  - "#type/company"
  - "#area/work"
company-type: client
industry: Financial Technology
website: https://acmecorp.com
location: "San Francisco, CA"
area: "[[Work]]"
relationship-start-date: 2026-03-15
primary-contact: "[[Jane Smith]]"
notes: Mid-market fintech company undergoing digital transformation. Decision maker is Jane Smith (VP Eng).
---
```

---

### `document`

**Canonical folder:** `03-Resources/Documents/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `document-type` | Enum | ✅ | `contract`, `proposal`, `specification`, `report`, `policy`, `legal`, `financial`, `other` | Document category |
| `document-date` | Date | ✅ | `YYYY-MM-DD` | Date created, signed, or effective |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area this document belongs to |
| `project` | Link | ⬜ | `"[[Project Name]]"` | Project that produced this document |
| `business` | Link | ⬜ | `"[[Business Name]]"` | Business this document pertains to |
| `parties` | Array(Link or String) | ⬜ | `["[[Person]]", "Acme Corp"]` | People or companies involved |
| `expiry-date` | Date | ⬜ | `YYYY-MM-DD` | Date this document expires |
| `version` | String | ⬜ | `MAJOR.MINOR` format | Document version |
| `file-location` | String | ⬜ | File path or URL | Location of the actual document file |
| `approval-status` | Enum | ⬜ | `draft`, `in-review`, `approved`, `signed`, `expired`, `superseded` | Approval state |

**Example:**
```yaml
---
type: document
title: Consulting Agreement — Acme Corp 2026
status: active
created-date: 2026-03-20
modified-date: 2026-03-20
tags:
  - "#type/document"
  - "#area/work"
document-type: contract
document-date: 2026-03-20
area: "[[Work]]"
business: "[[Acme Consulting LLC]]"
parties: ["[[Jane Smith]]", "Acme Corp"]
expiry-date: 2027-03-20
version: "1.0"
file-location: /documents/contracts/acme-corp-2026.pdf
approval-status: signed
---
```

---

### `template`

**Canonical folder:** `05-Templates/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `for-type` | Enum | ✅ | Any registered object type | The object type this template creates |
| `version` | String | ✅ | `MAJOR.MINOR` format | Template version |
| `templater-required` | Boolean | ✅ | `true` or `false` | Whether Templater plugin syntax is used |
| `description` | String | ⬜ | Non-empty string | What this template creates and when to use it |

**Example:**
```yaml
---
type: template
title: Project Template
status: active
created-date: 2026-01-01
modified-date: 2026-06-01
tags:
  - "#type/template"
for-type: project
version: "2.0"
templater-required: true
description: Creates a new project note with pre-filled frontmatter and standard sections.
---
```

---

### `resource`

**Canonical folder:** `03-Resources/`

| Property | Type | Req | Allowed Values / Format | Description |
|----------|------|-----|------------------------|-------------|
| `resource-type` | Enum | ✅ | `book`, `article`, `course`, `video`, `podcast`, `paper`, `framework`, `other` | Resource category |
| `area` | Link | ⬜ | `"[[Area Name]]"` | Area most relevant to this resource |
| `author` | String | ⬜ | Non-empty string | Author or creator |
| `url` | URL | ⬜ | `https://...` | URL to the resource |
| `published-date` | Date | ⬜ | `YYYY-MM-DD` | Original publication date |
| `read-date` | Date | ⬜ | `YYYY-MM-DD` | Date consumed by the user |
| `rating` | Number | ⬜ | 1–5 (integer) | Personal rating |
| `summary` | String | ⬜ | Non-empty string | One-paragraph summary |
| `key-takeaways` | Array(String) | ⬜ | `["takeaway text"]` | Most important insights |
| `related-knowledge` | Array(Link) | ⬜ | `["[[Knowledge Note]]"]` | Knowledge notes derived from this resource |

**Example:**
```yaml
---
type: resource
title: Deep Work — Cal Newport
status: active
created-date: 2026-02-10
modified-date: 2026-04-01
tags:
  - "#type/resource"
  - "#area/learning"
resource-type: book
area: "[[Learning]]"
author: Cal Newport
published-date: 2016-01-05
read-date: 2026-03-20
rating: 5
summary: >
  Argues that the ability to focus without distraction on cognitively demanding tasks
  is becoming increasingly rare and increasingly valuable. Provides a framework for
  developing deep work habits.
key-takeaways:
  - Deep work is the ability to focus without distraction on cognitively demanding tasks
  - Shallow work is non-cognitively demanding, logistical tasks often performed while distracted
  - Schedule every minute of the day to maximize deep work time
related-knowledge: ["[[Deep Work Philosophy]]", "[[Time Blocking]]"]
---
```

---

## Part IX — Tag Taxonomy

Tags provide cross-cutting classification on top of the structured frontmatter. They enable full-text search, Dataview filtering, and visual grouping.

### 9.1 Tag Format

All tags use hierarchical `#namespace/value` format. Tags are `kebab-case`. No spaces.

```
#area/health          ✅
#area/Health          ❌  (uppercase)
#areahealth           ❌  (no separator)
health                ❌  (no namespace)
```

### 9.2 Tag Namespaces

| Namespace | Format | Purpose | Required? |
|-----------|--------|---------|-----------|
| `#type/` | `#type/<object-type>` | Note type — mirrors the `type` frontmatter field | ✅ Always |
| `#area/` | `#area/<domain>` | Life or work domain | ✅ When applicable |
| `#status/` | `#status/<status-value>` | Lifecycle state — mirrors the `status` field | ⬜ Optional |
| `#priority/` | `#priority/<value>` | Priority level — mirrors the `priority` field | ⬜ Optional |
| `#review/` | `#review/<cadence>` | Review cadence — mirrors `review-cadence` | ⬜ Optional |
| `#domain/` | `#domain/<subject>` | Knowledge domain for `knowledge` and `resource` notes | ⬜ Optional |
| `#project/` | `#project/<project-slug>` | Cross-reference to a specific project | ⬜ Optional |

### 9.3 Tag Allowed Values

**`#type/` values** (one required per note):
`area`, `business`, `project`, `task`, `goal`, `knowledge`, `decision`, `meeting`, `risk`, `opportunity`, `asset`, `tool`, `automation`, `workflow`, `prompt`, `ai-agent`, `person`, `company`, `document`, `template`, `resource`

**`#area/` values:**
`work`, `health`, `finance`, `relationships`, `learning`, `personal`, `home`

**`#status/` values:**
`draft`, `active`, `paused`, `completed`, `abandoned`, `archived`, `deprecated`

**`#priority/` values:**
`critical`, `high`, `medium`, `low`

**`#review/` values:**
`daily`, `weekly`, `monthly`, `quarterly`, `annually`

### 9.4 Tag Rules

1. Every note must have exactly one `#type/` tag matching its `type` frontmatter field.
2. Every note should have at least one `#area/` tag indicating its life domain.
3. Do not create new tag namespaces without updating this document.
4. `#status/` and `#priority/` tags are optional but must mirror the frontmatter value if used.
5. Tags must not duplicate information already precisely encoded in frontmatter — they exist for search and visual filtering, not as the authoritative source.

---

## Part X — Validation Rules

### 10.1 Global Rules

These rules apply to every note in the vault without exception.

| ID | Rule |
|----|------|
| G-01 | Every note must have all six universal properties: `type`, `title`, `status`, `created-date`, `modified-date`, `tags`. |
| G-02 | `type` must be one of the 21 registered types in OBJECT_MODEL.md. |
| G-03 | `status` must be a value permitted for the note's `type` (see Part IV, §4.2). |
| G-04 | All date values must follow `YYYY-MM-DD` ISO 8601 format. No partial dates, no datetime values, no slashes. |
| G-05 | `created-date` must not be in the future at the time the note is created. |
| G-06 | `modified-date` must be ≥ `created-date`. |
| G-07 | `title` must be non-empty and must not consist solely of whitespace. |
| G-08 | No two active notes of the same `type` may share an identical `title`. |
| G-09 | Optional fields must be entirely omitted when not in use — not set to `null`, `""`, or `[]`. |
| G-10 | All enum values must exactly match the allowed values defined in this document (case-sensitive, `kebab-case`). |
| G-11 | All `Link` values must be quoted wikilinks: `"[[Note Title]]"`. |
| G-12 | Every note must have at least one tag, and the tag set must include exactly one `#type/` tag. |
| G-13 | Notes are never deleted — they are transitioned to `archived` status. |
| G-14 | `modified-date` must be updated every time a note is substantively edited. |

### 10.2 Date Rules

| ID | Rule |
|----|------|
| D-01 | `completed-date`, `read-date`, `acquisition-date`, `meeting-date`, `decision-date`, and all other event-recording date fields must not be set to a future date. |
| D-02 | `target-date`, `due-date`, `expiry-date`, `next-review-date`, `review-date`, and `decision-deadline` may be set to future dates. |
| D-03 | `target-date` or `due-date` must not be before `start-date` or `created-date` on the same note. |
| D-04 | `expiry-date` must be after `document-date` on `document` notes. |
| D-05 | `last-review-date` must not be in the future. |
| D-06 | `next-review-date` must be in the future when `review-status` is `scheduled`. |

### 10.3 Relationship Rules

| ID | Rule |
|----|------|
| R-01 | Every `Link` value must reference a note that exists in the vault. |
| R-02 | Every `Link` value must reference a note of the expected type. (e.g., `area` must link to a note with `type: area`). |
| R-03 | A note must not link to itself in any relationship field. |
| R-04 | `depends-on` chains on `task` notes must not form a cycle. |
| R-05 | `Array(Link)` fields must not contain duplicate wikilink references. |
| R-06 | `organization` on `person` notes may be either a `"[[Company]]"` link or a plain string — mixed types within the same field are not permitted. |
| R-07 | If `status` is `archived` on a parent note (e.g., `project`), child notes (`task`) linked to it should also be `archived` or `completed`. |

### 10.4 Status Rules

| ID | Rule |
|----|------|
| S-01 | `area` notes must not have `status: completed`. Areas do not complete — use `archived`. |
| S-02 | `decision` notes must not have `status: draft` or `status: completed`. Valid values are `active` and `archived` only. |
| S-03 | `meeting` notes must not remain `status: active` — they must transition to `completed` once the meeting ends. |
| S-04 | `completed-date` must be present when `status: completed`. |
| S-05 | `completed-date` must not be present when `status` is `draft`, `active`, or `paused`. |
| S-06 | `status: archived` is terminal — archived notes must not be transitioned back to `active` without creating a new note. |

### 10.5 Type-Specific Rules

| ID | Type | Rule |
|----|------|------|
| T-01 | `project` | `next-action` must be present on all `status: active` projects. |
| T-02 | `project` | `outcome` must describe an end state (not an activity). |
| T-03 | `task` | `area` must match the `area` of the linked `project`. |
| T-04 | `goal` | `progress` must be an integer between 0 and 100 inclusive. |
| T-05 | `goal` | `next-review-date` is required (not merely optional) for `status: active` goals. |
| T-06 | `knowledge` | `status: completed` is not valid — knowledge notes do not complete. |
| T-07 | `risk` | `risk-statement` must contain both a condition and a consequence. |
| T-08 | `risk` | At least one of `project`, `goal`, or `business` must be linked. |
| T-09 | `person` | `email` must match the format `user@domain.tld` if present. |
| T-10 | `person` | `birthday` must match `MM-DD` or `YYYY-MM-DD` format if present. |
| T-11 | `asset` | `estimated-value` and `acquisition-cost` must be non-negative numbers. |
| T-12 | `asset` | `depreciation-rate` must be between 0 and 100 inclusive if present. |
| T-13 | `resource` | `rating` must be an integer between 1 and 5 inclusive if present. |
| T-14 | `template` | Only one `status: active` template may exist per `for-type` at any time. |
| T-15 | `template` | `version` must follow `MAJOR.MINOR` format. |
| T-16 | `workflow` | `steps` must contain at least 2 items. |
| T-17 | `automation` | `script-location` is required for `automation-type: script` and `automation-type: scheduled-job`. |
| T-18 | `document` | `expiry-date` must be after `document-date` if both are present. |
| T-19 | `decision` | `decision-statement` must begin with "Decided to" or equivalent declarative phrasing. |
| T-20 | `opportunity` | `decision-deadline` must not be in the past when `status: active`. |
| T-21 | `prompt` | `version` and `last-tested-date` are required for `status: active` prompts used by `ai-agent` notes. |
| T-22 | `ai-agent` | `scope` must be present and non-empty — vague scope definitions are invalid. |
