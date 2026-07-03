# LifeOS Enterprise — Object Model

> Defines all first-class object types in the LifeOS system, their purpose, metadata schemas, relationships, lifecycle, examples, and validation rules.

---

## Overview

The LifeOS object model defines a typed taxonomy of notes. Every note in the vault belongs to exactly one type. The type determines:

- The required and optional frontmatter properties
- The canonical folder location
- The template used to create the note
- The dashboards and queries that surface the note
- The lifecycle it participates in

All types inherit a set of **universal properties** (see [METADATA_SCHEMA.md](./METADATA_SCHEMA.md)). This document defines only the type-specific additions.

---

## Universal Properties

Every object carries these properties regardless of type.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | Enum | ✅ | The object type — must be one of the types defined in this document |
| `title` | String | ✅ | Human-readable name of the note |
| `status` | Enum | ✅ | `draft`, `active`, `paused`, `completed`, `archived` |
| `created-date` | Date | ✅ | ISO 8601 date the note was created (`YYYY-MM-DD`) |
| `modified-date` | Date | ✅ | ISO 8601 date the note was last modified (`YYYY-MM-DD`) |
| `tags` | Array(String) | ✅ | Classification tags following `#namespace/value` convention |

---

## Object Type Registry

| Type | Description | Canonical Folder |
|------|-------------|-----------------|
| [`area`](#area) | Long-term life or work domain | `02-Areas/` |
| [`business`](#business) | A business entity being operated or tracked | `02-Areas/Work/Businesses/` |
| [`project`](#project) | Bounded effort with a defined outcome | `01-Projects/` |
| [`task`](#task) | A single discrete action | `01-Projects/[Project]/` |
| [`goal`](#goal) | A desired outcome with a measurable target | `02-Areas/Goals/` |
| [`knowledge`](#knowledge) | A captured insight, concept, or learning | `03-Resources/Knowledge/` |
| [`decision`](#decision) | A logged decision with context and rationale | `06-Meta/Decisions/` |
| [`meeting`](#meeting) | Record of a meeting or conversation | `02-Areas/Relationships/Meetings/` |
| [`risk`](#risk) | An identified threat to a project or goal | `06-Meta/Risks/` |
| [`opportunity`](#opportunity) | A potential positive outcome worth pursuing | `06-Meta/Opportunities/` |
| [`asset`](#asset) | A valuable owned resource (physical, digital, financial) | `02-Areas/Finance/Assets/` |
| [`tool`](#tool) | A software or physical tool used in the system | `03-Resources/Tools/` |
| [`automation`](#automation) | A defined automated process or script | `03-Resources/Automations/` |
| [`workflow`](#workflow) | A repeatable sequence of steps for a recurring task | `03-Resources/Workflows/` |
| [`prompt`](#prompt) | An AI prompt or instruction pattern | `03-Resources/Prompts/` |
| [`ai-agent`](#ai-agent) | A configured AI agent with a defined role | `03-Resources/AI-Agents/` |
| [`person`](#person) | A contact or relationship note | `02-Areas/Relationships/People/` |
| [`company`](#company) | An organization — employer, client, vendor, or partner | `02-Areas/Relationships/Companies/` |
| [`document`](#document) | A formal document (contract, report, specification) | `03-Resources/Documents/` |
| [`template`](#template) | A note scaffold (not a content note) | `05-Templates/` |
| [`resource`](#resource) | General reference material (book, article, course) | `03-Resources/` |

---

## Object Type Definitions

---

### `area`

#### Purpose

An Area is a long-term sphere of responsibility that does not have an end date. Areas represent the ongoing domains of life and work that a person is accountable for — they do not complete, they are maintained. Every project, goal, and task ultimately serves one or more areas.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `domain` | Enum | ✅ | Life domain: `work`, `health`, `finance`, `relationships`, `learning`, `personal`, `home` |
| `purpose` | String | ✅ | One-sentence statement of why this area exists |
| `review-cadence` | Enum | ✅ | `weekly`, `monthly`, `quarterly` |
| `last-review-date` | Date | ⬜ | Date of the most recent area review |
| `current-priority` | Enum | ⬜ | `high`, `medium`, `low` |

#### Relationships

- Has many `project` notes (active work within this area)
- Has many `goal` notes (desired outcomes for this area)
- Has many `person` notes (people associated with this domain)
- Referenced by `daily-note`, `weekly-review`, `monthly-review`

#### Lifecycle

`active` → `paused` → `archived`

Areas are rarely closed. They move to `archived` only when the domain is permanently retired (e.g., a career change, a sold business). They are never `completed`.

#### Examples

- `Health` — physical wellbeing, fitness, nutrition, sleep
- `Finance` — income, savings, investments, expenses
- `Career` — professional development, job role, skills
- `Home` — household maintenance, living environment

#### Validation Rules

1. `domain` must be one of the defined enum values.
2. `status` must not be `completed` — areas do not complete.
3. `purpose` must be present and non-empty.
4. `review-cadence` must be present.
5. Each `domain` value should have at most one active area note.

---

### `business`

#### Purpose

A Business note represents a specific business entity — one the user owns, operates, consults for, or is actively building. It is the top-level object for tracking business context: strategy, health, people, and projects that fall under a commercial or entrepreneurial domain. It differs from `area` in that it is entity-specific, not domain-generic.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `business-type` | Enum | ✅ | `owned`, `client`, `employer`, `partner`, `investee` |
| `industry` | String | ✅ | Industry or sector |
| `stage` | Enum | ✅ | `idea`, `pre-revenue`, `active`, `scaling`, `exiting`, `closed` |
| `legal-entity` | String | ⬜ | Legal structure (LLC, S-Corp, sole proprietor, etc.) |
| `founding-date` | Date | ⬜ | Date the business was founded |
| `website` | String | ⬜ | Primary website URL |
| `related-company` | Link | ⬜ | Link to associated `company` note if externally incorporated |
| `area` | Link | ⬜ | Parent `area` note (typically `Work`) |
| `goals` | Array(Link) | ⬜ | Strategic goals tied to this business |
| `review-cadence` | Enum | ⬜ | `weekly`, `monthly`, `quarterly` |

#### Relationships

- Belongs to one `area` (typically the Work domain)
- May link to one `company` note
- Has many `project` notes (business initiatives)
- Has many `person` notes (team, advisors, clients)
- Has many `goal` notes (business objectives)
- Has many `risk` notes
- Has many `opportunity` notes
- Has many `asset` notes

#### Lifecycle

`idea` → `pre-revenue` → `active` → `scaling` → `exiting` → `closed`

Tracked via the `stage` property. Status follows universal values: `active`, `paused`, `archived`.

#### Examples

- `Acme Consulting LLC` — a solo consulting practice
- `SaaS Product X` — a bootstrapped software product
- `Real Estate Holdings` — a property investment portfolio

#### Validation Rules

1. `business-type` must be one of the defined enum values.
2. `stage` must be one of the defined enum values.
3. `industry` must be present and non-empty.
4. If `business-type` is `owned`, a `founding-date` is strongly recommended.
5. `status: completed` is not valid — use `archived` when a business is closed.

---

### `project`

#### Purpose

A Project is a bounded effort with a clearly defined outcome and a natural end point. Unlike areas, projects are meant to be completed and then closed. A project exists to advance a goal or maintain an area, and every project must have an observable, concrete outcome — not an activity.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `area` | Link | ✅ | Parent area this project serves |
| `outcome` | String | ✅ | Desired end state — what "done" looks like |
| `start-date` | Date | ✅ | Date work began |
| `target-date` | Date | ⬜ | Desired completion date |
| `completed-date` | Date | ⬜ | Actual completion date (set when status → `completed`) |
| `next-action` | String | ⬜ | The single next physical action to move this forward |
| `goals` | Array(Link) | ⬜ | Goals this project advances |
| `priority` | Enum | ⬜ | `high`, `medium`, `low` |
| `business` | Link | ⬜ | Related business, if applicable |

#### Relationships

- Belongs to one `area`
- Optionally advances one or more `goal` notes
- Has many `task` notes
- May reference one `business`
- Referenced by `meeting` notes
- Referenced by `daily-note` (current project links)
- May have many `risk` and `opportunity` notes
- May produce `document` notes as outputs

#### Lifecycle

`draft` → `active` → `paused` → `completed` → `archived`

On completion, the project note moves to `01-Projects/Completed/` and is archived to `04-Archives/Projects/` within 90 days.

#### Examples

- `Launch Newsletter` — Write, design, and publish first issue by 2026-09-01
- `Migrate Infrastructure` — Move all services to new cloud provider
- `Complete Certification` — Pass AWS Solutions Architect exam

#### Validation Rules

1. `outcome` must be a concrete result, not a task or activity (e.g., "Newsletter launched" not "Work on newsletter").
2. `area` must link to a valid, active `area` note.
3. `start-date` must be present and must not be in the future when `status` is `active`.
4. `completed-date` must be set when `status` is `completed`.
5. `completed-date` must not be set when `status` is `active` or `draft`.
6. `next-action` must be present on all `active` projects.

---

### `task`

#### Purpose

A Task is a single discrete action that can be completed in one sitting. Tasks are the atomic unit of work. They are always associated with a parent project and represent the granular steps required to achieve that project's outcome. Tasks are not goals or projects — they are specific, concrete actions with a clear definition of done.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `project` | Link | ✅ | Parent project this task belongs to |
| `area` | Link | ✅ | Parent area (inherited from project, explicit for querying) |
| `due-date` | Date | ⬜ | Date by which the task must be completed |
| `priority` | Enum | ⬜ | `high`, `medium`, `low` |
| `effort` | Enum | ⬜ | Estimated effort: `small` (< 30 min), `medium` (30–120 min), `large` (> 2 hr) |
| `depends-on` | Array(Link) | ⬜ | Tasks that must be completed before this one |
| `assigned-to` | Link | ⬜ | Person responsible (if delegated) |
| `completed-date` | Date | ⬜ | Actual completion date |

#### Relationships

- Belongs to one `project`
- Inherits the `area` of its parent project
- May block or be blocked by other `task` notes (`depends-on`)
- May be assigned to a `person`

#### Lifecycle

`draft` → `active` → `completed` → `archived`

Completed tasks are kept in-project for reference but excluded from active task queries. Archived tasks move with their parent project to `04-Archives/`.

#### Examples

- `Write first draft of section 2` (project: `Finish Book Proposal`)
- `Schedule kickoff call with client` (project: `Client Onboarding`)
- `Run database migration script` (project: `Infrastructure Migration`)

#### Validation Rules

1. `project` must link to a valid, active or paused `project` note.
2. `area` must match the `area` of the linked project.
3. `completed-date` must be set when `status` is `completed`.
4. `completed-date` must not be set when `status` is `active` or `draft`.
5. A task must not be its own `depends-on` dependency.
6. `effort` must be one of the defined enum values if present.

---

### `goal`

#### Purpose

A Goal is a desired future state with a measurable outcome and a target date. Goals represent the "why" behind projects — they define where a person is headed, not just what they are doing. Goals operate at a longer time horizon than projects and are evaluated through key results or milestones. Every active goal should be served by at least one active project or habit.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `area` | Link | ✅ | Parent area this goal belongs to |
| `outcome` | String | ✅ | Specific, observable end state when this goal is achieved |
| `target-date` | Date | ✅ | Date by which this goal should be achieved |
| `key-results` | Array(String) | ⬜ | Measurable milestones that indicate progress |
| `progress` | Number | ⬜ | Estimated progress percentage (0–100) |
| `review-date` | Date | ⬜ | Next scheduled review of this goal |
| `horizon` | Enum | ⬜ | Time horizon: `90-day`, `annual`, `3-year`, `10-year` |
| `business` | Link | ⬜ | Related business, if this is a business goal |

#### Relationships

- Belongs to one `area`
- May belong to one `business`
- Advanced by one or more `project` notes
- Reviewed in `monthly-review` and `quarterly-review` notes
- Referenced by `daily-note` (focus goals)

#### Lifecycle

`draft` → `active` → `completed` / `abandoned` → `archived`

Goals are reviewed at minimum monthly. An abandoned goal requires a note explaining the decision and the lesson learned.

#### Examples

- `Reach $10,000 MRR by 2026-12-31` (area: Finance, horizon: annual)
- `Complete marathon in under 4 hours by 2027-03-15` (area: Health, horizon: annual)
- `Publish 12 newsletter issues in 2026` (area: Work, horizon: annual)

#### Validation Rules

1. `outcome` must be specific and measurable — not vague (e.g., "get fit" is invalid; "run a 5K in under 30 minutes" is valid).
2. `target-date` must be present and in the future when `status` is `active`.
3. `area` must link to a valid, active `area` note.
4. `progress` must be between 0 and 100 inclusive if present.
5. If `status` is `abandoned`, the note body must include a rationale section.
6. `horizon` must be one of the defined enum values if present.

---

### `knowledge`

#### Purpose

A Knowledge note captures a single insight, concept, principle, mental model, or learning that has lasting value. This is the atomic unit of the knowledge base — one idea per note. Knowledge notes are evergreen: they are refined over time rather than replaced. They differ from `resource` notes in that they represent synthesized understanding, not source material.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `domain` | String | ✅ | Subject area or discipline (e.g., `systems-thinking`, `finance`, `leadership`) |
| `source` | Link or String | ⬜ | Origin of the insight — a `resource`, `meeting`, or `decision` note, or a free-text citation |
| `confidence` | Enum | ⬜ | Confidence in this knowledge: `low`, `medium`, `high` |
| `related-knowledge` | Array(Link) | ⬜ | Related `knowledge` notes |
| `last-reviewed-date` | Date | ⬜ | When this note was last meaningfully reviewed or updated |
| `applies-to` | Array(Link) | ⬜ | Areas, projects, or goals this knowledge is currently applicable to |

#### Relationships

- May originate from a `resource`, `meeting`, or `decision`
- Links to related `knowledge` notes (concept graph)
- Applied to `area`, `project`, or `goal` notes via `applies-to`
- Surfaced in `knowledge-map` dashboard

#### Lifecycle

`draft` → `active` → `archived`

Knowledge notes do not complete. They evolve. An `archived` knowledge note has been superseded or is no longer relevant. Use the note body to explain the succession.

#### Examples

- `Pareto Principle` — 80% of outcomes come from 20% of inputs
- `Second-Order Thinking` — Consider the consequences of consequences
- `Minimum Viable Daily Review` — A daily review needs only 3 inputs to be effective

#### Validation Rules

1. `domain` must be present and non-empty.
2. `status` must not be `completed` — knowledge notes do not complete.
3. Each knowledge note must contain substantive body content — the title alone is insufficient.
4. `confidence` must be one of `low`, `medium`, `high` if present.
5. `related-knowledge` must link only to other `knowledge` type notes.

---

### `decision`

#### Purpose

A Decision note records a significant choice that was made — capturing the context, alternatives considered, the rationale chosen, and the expected outcome. Decision notes create an auditable log that prevents re-litigating past decisions and enables post-hoc review of whether decisions proved correct. They are filed permanently and never deleted.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `decision-date` | Date | ✅ | Date the decision was made |
| `decision-statement` | String | ✅ | The decision in one sentence: "We decided to X" |
| `context` | String | ✅ | Brief summary of the situation that required a decision |
| `alternatives` | Array(String) | ⬜ | Options that were considered but not chosen |
| `rationale` | String | ✅ | Why this option was selected over alternatives |
| `expected-outcome` | String | ⬜ | What we expect to happen as a result |
| `review-date` | Date | ⬜ | Scheduled date to evaluate whether the decision proved correct |
| `area` | Link | ⬜ | The area this decision belongs to |
| `project` | Link | ⬜ | The project this decision belongs to, if applicable |
| `outcome-actual` | String | ⬜ | What actually happened (filled in on review date) |

#### Relationships

- May belong to one `area` or one `project`
- Referenced by `meeting` notes (decisions made in meetings)
- Reviewed in `quarterly-review` and `annual-review`
- May spawn follow-on `project` or `task` notes

#### Lifecycle

`active` → `reviewed` (no completion)

Decisions are permanent records. They move to `archived` status only if superseded by a newer decision on the same topic, in which case the newer decision must link back to the original.

#### Examples

- `Decided to use Obsidian as the primary vault platform` (date: 2026-01-15)
- `Decided to pause the newsletter project until Q3` (date: 2026-05-10)
- `Decided to hire a contractor for design work` (date: 2026-06-01)

#### Validation Rules

1. `decision-date` must be present and must not be in the future.
2. `decision-statement` must begin with "Decided to" or equivalent declarative phrasing.
3. `rationale` must be present and non-empty.
4. `context` must be present and non-empty.
5. `status` must not be `completed` or `draft` — decisions are either `active` or `archived`.
6. If `outcome-actual` is set, `review-date` must also be present.

---

### `meeting`

#### Purpose

A Meeting note records a synchronous interaction — a call, video meeting, in-person conversation, or interview. It captures what was discussed, what was decided, and what actions were agreed upon. Meeting notes are the primary mechanism for converting conversations into structured knowledge and commitments.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `meeting-date` | Date | ✅ | Date the meeting occurred |
| `meeting-type` | Enum | ✅ | `1-1`, `team`, `client`, `interview`, `call`, `workshop`, `other` |
| `attendees` | Array(Link) | ✅ | Links to `person` notes for each attendee |
| `duration-minutes` | Number | ⬜ | Length of the meeting in minutes |
| `project` | Link | ⬜ | Related project, if the meeting serves one |
| `area` | Link | ⬜ | Related area, if not project-specific |
| `company` | Link | ⬜ | Related company, if applicable |
| `action-items` | Array(String) | ⬜ | Committed actions with owner names |
| `decisions-made` | Array(Link) | ⬜ | Links to `decision` notes created as a result of this meeting |

#### Relationships

- Links to many `person` notes (attendees)
- Optionally belongs to one `project` or one `area`
- May produce `decision` notes
- May produce `task` notes from action items
- Optionally links to one `company`
- Referenced by `daily-note`

#### Lifecycle

`draft` → `completed` → `archived`

Meeting notes transition to `completed` immediately after the meeting ends and notes are finalized. They do not remain `active`.

#### Examples

- `2026-07-03 Weekly Sync with Design Team`
- `2026-06-15 Client Kickoff Call — Acme Corp`
- `2026-05-20 1-1 with Manager`

#### Validation Rules

1. `meeting-date` must not be in the future when `status` is `completed`.
2. `attendees` must contain at least one link to a `person` note.
3. `meeting-type` must be one of the defined enum values.
4. `status` must be `completed` or `archived` — meeting notes are not left `active`.
5. `action-items` entries should follow the format `"[Owner]: [Action]"` (recommended, not enforced).
6. `decisions-made` must link only to `decision` type notes.

---

### `risk`

#### Purpose

A Risk note documents an identified threat that could negatively impact a project, goal, or business. Capturing risks explicitly surfaces assumptions, encourages mitigation planning, and creates an audit trail for decisions made under uncertainty. Risks are not problems — they are potential problems that may or may not materialize.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `risk-statement` | String | ✅ | "If X happens, then Y consequence will occur" |
| `likelihood` | Enum | ✅ | Probability of occurring: `low`, `medium`, `high` |
| `impact` | Enum | ✅ | Severity if it occurs: `low`, `medium`, `high`, `critical` |
| `mitigation` | String | ⬜ | Actions to reduce likelihood or impact |
| `contingency` | String | ⬜ | Response plan if the risk materializes |
| `owner` | Link | ⬜ | Person responsible for monitoring this risk |
| `project` | Link | ⬜ | Project this risk is associated with |
| `goal` | Link | ⬜ | Goal this risk threatens |
| `business` | Link | ⬜ | Business this risk applies to |
| `review-date` | Date | ⬜ | Next scheduled review of this risk |

#### Relationships

- Belongs to one `project`, `goal`, or `business`
- May be owned by a `person`
- Reviewed in `project` reviews and `quarterly-review`

#### Lifecycle

`active` → `mitigated` / `materialized` / `expired` → `archived`

A risk that materializes becomes an issue. Document the outcome in the note body before archiving.

#### Examples

- `If key contractor becomes unavailable, project timeline will slip by 6 weeks`
- `If interest rates rise above 7%, the real estate investment becomes cash-flow negative`
- `If competitor launches similar product before us, market differentiation narrows significantly`

#### Validation Rules

1. `risk-statement` must follow the "If X, then Y" pattern.
2. `likelihood` must be one of `low`, `medium`, `high`.
3. `impact` must be one of `low`, `medium`, `high`, `critical`.
4. At least one of `project`, `goal`, or `business` must be linked.
5. `status` must not be `completed` — use `archived` with a disposition note.
6. `owner` must link to a `person` note if present.

---

### `opportunity`

#### Purpose

An Opportunity note captures a potential positive outcome worth tracking and deciding on — a new venture, partnership, career move, investment, or strategic pivot. Opportunities require a capture mechanism so that promising ideas are not lost, and a decision mechanism so that they are acted on or explicitly declined rather than lingering indefinitely.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `opportunity-type` | Enum | ✅ | `business`, `career`, `investment`, `partnership`, `learning`, `personal`, `other` |
| `description` | String | ✅ | What the opportunity is and why it is worth considering |
| `potential-upside` | String | ⬜ | What could be gained if pursued |
| `cost-or-risk` | String | ⬜ | What pursuing it would cost or risk |
| `decision-deadline` | Date | ⬜ | Date by which a go/no-go decision must be made |
| `area` | Link | ⬜ | Area this opportunity is most relevant to |
| `business` | Link | ⬜ | Business this opportunity relates to |
| `related-decision` | Link | ⬜ | Link to the `decision` note if a decision was made |
| `source` | String | ⬜ | Where this opportunity came from |

#### Relationships

- May belong to one `area` or `business`
- Transitions to a `decision` note when acted upon or declined
- A pursued opportunity typically generates a new `project` note

#### Lifecycle

`draft` → `active` → `pursuing` / `declined` → `archived`

No opportunity should remain `active` indefinitely. Every opportunity that is not pursued must be explicitly `declined` with a rationale recorded in the note body.

#### Examples

- `Partnership with XYZ Agency for co-marketing`
- `Speaking slot at industry conference`
- `Rental property acquisition at 123 Main Street`

#### Validation Rules

1. `opportunity-type` must be one of the defined enum values.
2. `description` must be present and non-empty.
3. If `status` is `archived` without a `related-decision`, the note body must explain the outcome.
4. `decision-deadline` must not be in the past when `status` is `active`.
5. `related-decision` must link only to a `decision` type note if present.

---

### `asset`

#### Purpose

An Asset note tracks a valuable resource owned by or available to the user — physical, digital, intellectual, or financial. Asset notes create an inventory that is useful for financial awareness, depreciation tracking, insurance documentation, and system audits. Not every physical item is an asset; only those above a threshold of value or strategic importance.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `asset-type` | Enum | ✅ | `financial`, `physical`, `digital`, `intellectual`, `real-estate`, `vehicle`, `equipment` |
| `estimated-value` | Number | ⬜ | Current estimated value in USD (or base currency) |
| `acquisition-date` | Date | ⬜ | Date the asset was acquired |
| `acquisition-cost` | Number | ⬜ | Original cost of acquisition |
| `location` | String | ⬜ | Physical location or account/platform for digital assets |
| `area` | Link | ⬜ | Area this asset belongs to (typically Finance or Home) |
| `business` | Link | ⬜ | Business this asset belongs to, if applicable |
| `depreciation-rate` | Number | ⬜ | Annual depreciation percentage, if applicable |
| `insurance-policy` | String | ⬜ | Policy reference if the asset is insured |
| `last-valued-date` | Date | ⬜ | Date of most recent value assessment |

#### Relationships

- Belongs to one `area` or `business`
- May be referenced in `monthly-review` for financial snapshot
- May be referenced in `risk` notes (e.g., asset at risk of damage)

#### Lifecycle

`active` → `sold` / `disposed` → `archived`

Use the `archived` status when an asset is sold, lost, or decommissioned. Record disposition details in the note body.

#### Examples

- `MacBook Pro 16" M3` (type: equipment, value: $3,500)
- `S&P 500 Index Fund — Vanguard` (type: financial)
- `Domain: lifeos.io` (type: digital)
- `2022 Toyota Tacoma` (type: vehicle)

#### Validation Rules

1. `asset-type` must be one of the defined enum values.
2. `estimated-value` must be a non-negative number if present.
3. `acquisition-cost` must be a non-negative number if present.
4. `depreciation-rate` must be between 0 and 100 if present.
5. `last-valued-date` must not be in the future.
6. `status` must not be `completed` — use `archived` for disposed assets.

---

### `tool`

#### Purpose

A Tool note documents a software application, physical device, or service that is part of the operating system or regularly used in workflows. Tool notes create an auditable inventory of the technology stack, support onboarding, and enable deliberate evaluation of tool sprawl. Every tool in regular use should be documented.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `tool-type` | Enum | ✅ | `software`, `hardware`, `service`, `plugin`, `browser-extension`, `cli`, `other` |
| `purpose` | String | ✅ | What this tool is used for in the system |
| `url` | String | ⬜ | Primary URL or app store link |
| `cost` | String | ⬜ | Pricing — `free`, monthly cost, or annual cost |
| `version` | String | ⬜ | Current version in use |
| `area` | Link | ⬜ | Primary area this tool serves |
| `replaces` | Link | ⬜ | `tool` note this replaced, if applicable |
| `last-evaluated-date` | Date | ⬜ | When this tool was last deliberately evaluated for continued use |
| `alternatives` | Array(String) | ⬜ | Known alternative tools considered |

#### Relationships

- Belongs to one or more `area` notes
- May replace another `tool` note
- Referenced by `automation` and `workflow` notes
- Referenced by `ai-agent` notes (tools used by the agent)
- Reviewed in `quarterly-review` (system audit)

#### Lifecycle

`active` → `paused` → `archived`

A tool is `archived` when it is no longer in use. Document the reason and the replacement in the note body.

#### Examples

- `Obsidian` (type: software, purpose: primary vault and knowledge base)
- `Templater` (type: plugin, purpose: dynamic note creation in Obsidian)
- `Raycast` (type: software, purpose: launcher, clipboard, and quick actions)
- `1Password` (type: software, purpose: credential management)

#### Validation Rules

1. `tool-type` must be one of the defined enum values.
2. `purpose` must be present and non-empty.
3. `replaces` must link only to a `tool` type note if present.
4. `status` must not be `completed` — use `archived` for retired tools.
5. `last-evaluated-date` must not be in the future if present.

---

### `automation`

#### Purpose

An Automation note documents a specific automated process — a script, scheduled job, webhook, Zapier/Make flow, or Templater function — that performs a task without manual intervention. Each automation has a defined trigger, a set of actions, and a defined output. Documenting automations prevents the system from becoming an undocumented black box.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `trigger` | String | ✅ | What initiates this automation (e.g., "daily at 08:00", "on file creation", "webhook from X") |
| `actions` | Array(String) | ✅ | Ordered list of actions the automation performs |
| `output` | String | ✅ | What is produced or changed as a result |
| `automation-type` | Enum | ✅ | `templater`, `script`, `scheduled-job`, `webhook`, `integration`, `other` |
| `tool` | Link | ⬜ | Primary `tool` note that runs this automation |
| `area` | Link | ⬜ | Area this automation serves |
| `workflow` | Link | ⬜ | Parent `workflow` this automation is part of |
| `error-handling` | String | ⬜ | What happens if the automation fails |
| `last-run-date` | Date | ⬜ | Date of most recent successful execution |
| `script-location` | String | ⬜ | File path or repository location of the script |

#### Relationships

- Uses one or more `tool` notes
- May belong to a `workflow`
- Serves one `area` or `project`
- Reviewed in `quarterly-review` (system audit)

#### Lifecycle

`draft` → `active` → `paused` → `archived`

An automation is `paused` when temporarily disabled. It is `archived` when permanently decommissioned. Always document why it was decommissioned.

#### Examples

- `Daily Note Auto-Creation` — triggered at 07:00, creates today's daily note from template
- `Inbox Age Check` — runs nightly, flags notes older than 7 days in Inbox
- `Project Archival` — runs on project completion, moves project folder to Completed/

#### Validation Rules

1. `trigger` must be present and describe a specific, observable event.
2. `actions` must contain at least one item.
3. `output` must be present and non-empty.
4. `automation-type` must be one of the defined enum values.
5. `script-location` must be present for `script` and `scheduled-job` types.
6. `tool` must link to a valid `tool` note if present.

---

### `workflow`

#### Purpose

A Workflow note documents a repeatable, multi-step process for a recurring task that involves human judgment, decision points, or coordination — and therefore cannot be fully automated. Workflows are the "standard operating procedures" of the system. They ensure consistency, reduce cognitive load, and can be handed off or taught to others. They differ from automations in that they require human execution at one or more steps.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `purpose` | String | ✅ | What this workflow accomplishes |
| `trigger` | String | ✅ | When or why this workflow is initiated |
| `steps` | Array(String) | ✅ | Ordered, numbered list of steps |
| `estimated-duration` | String | ⬜ | Typical time to complete (e.g., "45 minutes") |
| `area` | Link | ⬜ | Area this workflow serves |
| `tools-required` | Array(Link) | ⬜ | `tool` notes required to execute this workflow |
| `automations-used` | Array(Link) | ⬜ | `automation` notes embedded in this workflow |
| `output` | String | ⬜ | What is produced or the state of the system after completion |
| `last-run-date` | Date | ⬜ | Most recent date this workflow was executed |
| `version` | String | ⬜ | Version number using `MAJOR.MINOR` format |

#### Relationships

- Belongs to one `area`
- Uses `tool` notes
- May incorporate `automation` notes
- Referenced by review notes (weekly, monthly, quarterly)

#### Lifecycle

`draft` → `active` → `paused` → `archived`

Workflows are versioned. When a workflow is significantly revised, increment the version number and note the changes. Archive superseded versions.

#### Examples

- `Weekly Review Workflow` — 8-step review process run every Sunday
- `New Client Onboarding` — process from first meeting to signed contract
- `Content Publishing Workflow` — steps to research, draft, review, and publish content

#### Validation Rules

1. `purpose` must be present and non-empty.
2. `trigger` must describe a specific condition or schedule.
3. `steps` must contain at least two items.
4. `tools-required` must link only to `tool` type notes if present.
5. `automations-used` must link only to `automation` type notes if present.
6. `version` must follow `MAJOR.MINOR` format if present (e.g., `1.0`, `2.3`).

---

### `prompt`

#### Purpose

A Prompt note stores a reusable AI prompt or instruction pattern — a carefully engineered text input designed to produce a specific, reliable output from an AI model. Prompts are first-class objects because prompt quality directly determines the value of AI integration in the system. Documenting prompts enables iteration, version control, and reuse.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `prompt-type` | Enum | ✅ | `synthesis`, `capture`, `review`, `generation`, `analysis`, `classification`, `other` |
| `model` | String | ✅ | AI model this prompt is optimized for (e.g., `gpt-4o`, `claude-3-5-sonnet`) |
| `purpose` | String | ✅ | What output this prompt is designed to produce |
| `prompt-text` | String | ✅ | The full prompt text (may be in the note body) |
| `input-variables` | Array(String) | ⬜ | Named variables that must be substituted before use (e.g., `{{note_title}}`) |
| `expected-output` | String | ⬜ | Description of the expected response format |
| `ai-agent` | Link | ⬜ | `ai-agent` note this prompt belongs to |
| `area` | Link | ⬜ | Area this prompt supports |
| `version` | String | ⬜ | Version number (`MAJOR.MINOR`) |
| `last-tested-date` | Date | ⬜ | Date this prompt was last validated with the target model |

#### Relationships

- May belong to one `ai-agent`
- Belongs to one `area` or serves a specific workflow
- Used within `workflow` and `automation` notes
- Reviewed when the target model is updated

#### Lifecycle

`draft` → `active` → `deprecated` → `archived`

A prompt is `deprecated` when it no longer produces reliable output (e.g., after a model update). Archive it and create a new version.

#### Examples

- `Weekly Synthesis Prompt` — summarizes all notes created in the past 7 days
- `Meeting Action Item Extractor` — extracts and formats action items from raw meeting notes
- `Note Tagger` — suggests appropriate tags for a new knowledge note

#### Validation Rules

1. `prompt-type` must be one of the defined enum values.
2. `model` must be present and non-empty.
3. `purpose` must be present and non-empty.
4. `prompt-text` must be present — either inline in this field or in the note body, clearly marked.
5. `version` must follow `MAJOR.MINOR` format if present.
6. `last-tested-date` must not be in the future if present.
7. `ai-agent` must link only to an `ai-agent` type note if present.

---

### `ai-agent`

#### Purpose

An AI Agent note defines a configured AI assistant with a specific persona, instruction set, scope, and set of associated prompts. AI agents are the primary interface between the user and AI capabilities in the system. Documenting agents as first-class objects ensures clarity about what each agent can do, which model it uses, and how it integrates with vault data.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `model` | String | ✅ | Primary AI model powering this agent (e.g., `gpt-4o`, `claude-3-5-sonnet`) |
| `role` | String | ✅ | The agent's defined role in one sentence (e.g., "Life OS synthesis assistant") |
| `scope` | String | ✅ | What data, domains, or tasks this agent has access to and is responsible for |
| `instruction-set` | String | ✅ | Summary of the system prompt or instructions (full text in note body) |
| `capabilities` | Array(String) | ⬜ | List of things this agent can do |
| `limitations` | Array(String) | ⬜ | Known limitations or things this agent must not do |
| `prompts` | Array(Link) | ⬜ | `prompt` notes associated with this agent |
| `tools-used` | Array(Link) | ⬜ | `tool` notes representing integrations or plugins this agent uses |
| `area` | Link | ⬜ | Primary area this agent supports |
| `version` | String | ⬜ | Version number (`MAJOR.MINOR`) |

#### Relationships

- Has many `prompt` notes
- May use `tool` notes (plugins, integrations)
- Serves one or more `area` notes
- Referenced by `automation` and `workflow` notes

#### Lifecycle

`draft` → `active` → `deprecated` → `archived`

When an agent is significantly reconfigured, increment the version. Deprecated agents are archived rather than deleted, preserving the instruction history.

#### Examples

- `LifeOS Daily Briefing Agent` — synthesizes yesterday's activity and surfaces today's priorities
- `Knowledge Synthesis Agent` — identifies themes and connections across knowledge notes
- `Meeting Preparation Agent` — researches attendees and surfaces relevant context before a meeting

#### Validation Rules

1. `model` must be present and non-empty.
2. `role` must be present and describe a specific function, not a vague capability.
3. `scope` must clearly define boundaries — what is and is not in scope.
4. `instruction-set` must be present — the full system prompt belongs in the note body.
5. `prompts` must link only to `prompt` type notes if present.
6. `tools-used` must link only to `tool` type notes if present.
7. `version` must follow `MAJOR.MINOR` format if present.

---

### `person`

#### Purpose

A Person note is the canonical record for an individual in the user's life — professional contact, friend, family member, collaborator, or advisor. It serves as the CRM layer of the system: tracking relationship health, interaction history, and context. All attendee references in meeting notes link to person notes, ensuring people are never lost in free text.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `relationship-type` | Enum | ✅ | `professional`, `personal`, `family`, `advisor`, `client`, `vendor` |
| `organization` | Link or String | ⬜ | Current employer or affiliation — link to `company` note or free-text string |
| `email` | String | ⬜ | Primary email address |
| `phone` | String | ⬜ | Primary phone number |
| `location` | String | ⬜ | City, state/country of residence |
| `last-contact-date` | Date | ⬜ | Date of most recent interaction |
| `contact-cadence` | Enum | ⬜ | Desired contact frequency: `weekly`, `monthly`, `quarterly`, `annually`, `as-needed` |
| `met-date` | Date | ⬜ | Date first met or connected |
| `met-context` | String | ⬜ | How or where the relationship began |
| `birthday` | String | ⬜ | Birthday in `MM-DD` format (year optional) |

#### Relationships

- May belong to one or more `company` notes
- Attends `meeting` notes
- Referenced by `task` notes (assigned-to)
- Referenced by `risk` notes (owner)
- Referenced by `project` notes (collaborators or stakeholders)
- Referenced by `business` notes (team, advisors)

#### Lifecycle

`active` → `paused` → `archived`

A person note is `archived` when the relationship has ended (e.g., former colleague with no ongoing contact). It is never deleted.

#### Examples

- `Jane Smith` — VP of Engineering at Acme Corp, professional contact
- `Dr. Robert Chen` — primary care physician, relationship: personal
- `Mom` — family, no organization

#### Validation Rules

1. `relationship-type` must be one of the defined enum values.
2. `email` must be a valid email format if present.
3. `contact-cadence` must be one of the defined enum values if present.
4. `birthday` must follow `MM-DD` or `YYYY-MM-DD` format if present.
5. `last-contact-date` must not be in the future.
6. `organization` must link to a `company` note or be a plain string — not a wikilink to a non-company type.
7. `status` must not be `completed` — use `archived` for ended relationships.

---

### `company`

#### Purpose

A Company note represents an organization — an employer, client, partner, vendor, competitor, or investee. Company notes serve as the anchor for professional relationships: person notes link to them, projects reference them, and meeting notes may cite them. They prevent organizations from existing only as free-text strings scattered across notes.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `company-type` | Enum | ✅ | `employer`, `client`, `vendor`, `partner`, `competitor`, `investee`, `other` |
| `industry` | String | ✅ | Industry or sector |
| `website` | String | ⬜ | Primary website URL |
| `location` | String | ⬜ | Headquarters city and country |
| `relationship-start-date` | Date | ⬜ | Date the relationship with this company began |
| `primary-contact` | Link | ⬜ | `person` note of the primary contact at this company |
| `area` | Link | ⬜ | Area this company relationship belongs to |
| `related-business` | Link | ⬜ | Link to the user's `business` note if there is a formal business relationship |
| `notes` | String | ⬜ | Key context about this company |

#### Relationships

- Has many `person` notes (employees, contacts)
- Referenced by `project` notes
- Referenced by `meeting` notes
- May link to user's `business` note
- Referenced by `asset` and `risk` notes

#### Lifecycle

`active` → `archived`

A company is archived when the relationship has permanently ended (e.g., client churned, employer left with no ongoing contact). It is never deleted.

#### Examples

- `Acme Corp` — client, technology sector
- `Google` — employer (former), technology sector
- `AWS` — vendor, cloud infrastructure

#### Validation Rules

1. `company-type` must be one of the defined enum values.
2. `industry` must be present and non-empty.
3. `primary-contact` must link to a `person` type note if present.
4. `related-business` must link to a `business` type note if present.
5. `status` must not be `completed` — use `archived` for ended relationships.

---

### `document`

#### Purpose

A Document note represents a formal, structured document — a contract, proposal, specification, report, policy, or legal filing. Document notes differ from `knowledge` and `resource` notes in that they are formal artifacts with a defined version, approval state, and often a legal or business significance. The note serves as the index and context record for the document; the actual file may be attached or stored externally.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `document-type` | Enum | ✅ | `contract`, `proposal`, `specification`, `report`, `policy`, `legal`, `financial`, `other` |
| `document-date` | Date | ✅ | Date the document was created, signed, or effective |
| `parties` | Array(Link or String) | ⬜ | People or companies involved (`person` or `company` links, or free-text) |
| `expiry-date` | Date | ⬜ | Date the document expires or must be renewed |
| `version` | String | ⬜ | Document version in `MAJOR.MINOR` format |
| `file-location` | String | ⬜ | Path or URL to the actual document file |
| `area` | Link | ⬜ | Area this document belongs to |
| `project` | Link | ⬜ | Project this document is an output of |
| `business` | Link | ⬜ | Business this document pertains to |
| `approval-status` | Enum | ⬜ | `draft`, `in-review`, `approved`, `signed`, `expired`, `superseded` |

#### Relationships

- Belongs to one `project`, `area`, or `business`
- References `person` and `company` notes as parties
- May be produced by a `project` or `workflow`
- Referenced in `decision` notes

#### Lifecycle

`draft` → `active` → `expired` / `superseded` → `archived`

When a document expires or is superseded by a newer version, the old document note is archived. Always link from the new version to the old version.

#### Examples

- `Consulting Agreement — Acme Corp 2026` (type: contract)
- `Q3 2026 Business Performance Report` (type: report)
- `Infrastructure Architecture Specification v2` (type: specification)

#### Validation Rules

1. `document-type` must be one of the defined enum values.
2. `document-date` must be present.
3. `expiry-date` must be after `document-date` if both are present.
4. `approval-status` must be one of the defined enum values if present.
5. `version` must follow `MAJOR.MINOR` format if present.
6. `file-location` is strongly recommended — a document note without a file reference has limited utility.

---

### `template`

#### Purpose

A Template note is a note scaffold used by the Templater plugin to create new notes of a specific type. Template notes are system infrastructure, not content. They contain placeholder syntax, frontmatter pre-fill logic, and structural scaffolding. Templates are the mechanism by which consistent schema compliance is enforced at note creation time.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `for-type` | Enum | ✅ | The object type this template creates — must be a valid type from this document |
| `version` | String | ✅ | Version number (`MAJOR.MINOR`) |
| `templater-required` | Boolean | ✅ | Whether Templater plugin syntax is required (`true`) or static (`false`) |
| `description` | String | ⬜ | Brief description of what this template creates and when to use it |

#### Relationships

- Creates notes of a specific object type
- Stored in `05-Templates/` — excluded from all content queries
- Maintained in the `templates/` directory of this repository
- Referenced in `TEMPLATE_SPEC.md`

#### Lifecycle

`draft` → `active` → `deprecated` → `archived`

When a template is updated, increment the version. Deprecated templates are archived — never deleted, as they may be needed to interpret historical notes.

#### Examples

- `Daily-Note.md` — template for `daily-note` objects
- `Project.md` — template for `project` objects
- `Meeting.md` — template for `meeting` objects

#### Validation Rules

1. `for-type` must be one of the valid object types defined in this document.
2. `version` must follow `MAJOR.MINOR` format.
3. `templater-required` must be explicitly set to `true` or `false`.
4. A template note must not be processed by Dataview queries — ensure templates folder is excluded.
5. Only one `active` template should exist per `for-type` at any time.

---

### `resource`

#### Purpose

A Resource note captures a piece of reference material — a book, article, course, video, podcast, paper, or framework — that supports learning, projects, or areas. Resources are source material, as distinct from `knowledge` notes which represent the synthesized understanding derived from sources. Resources are evergreen and not time-sensitive; they are the library of the system.

#### Required Metadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `resource-type` | Enum | ✅ | `book`, `article`, `course`, `video`, `podcast`, `paper`, `framework`, `other` |
| `author` | String | ⬜ | Author or creator name |
| `url` | String | ⬜ | URL to the resource (for digital sources) |
| `published-date` | Date | ⬜ | Original publication date |
| `read-date` | Date | ⬜ | Date the user consumed or reviewed this resource |
| `rating` | Number | ⬜ | Personal rating on a 1–5 scale |
| `summary` | String | ⬜ | One-paragraph summary of the resource |
| `key-takeaways` | Array(String) | ⬜ | The most important insights extracted |
| `area` | Link | ⬜ | Area this resource is most relevant to |
| `related-knowledge` | Array(Link) | ⬜ | `knowledge` notes derived from this resource |

#### Relationships

- Supports one or more `area` notes
- Generates `knowledge` notes (synthesized ideas derived from it)
- May be referenced in `project` notes (reading or research tasks)

#### Lifecycle

`draft` → `active` → `archived`

A resource note is `active` once read or in-progress. It moves to `archived` when no longer relevant. Resources are rarely deleted — they form the historical record of the knowledge base.

#### Examples

- `Deep Work — Cal Newport` (type: book, area: Learning/Productivity)
- `The Pragmatic Programmer — Hunt & Thomas` (type: book, area: Work/Engineering)
- `Building a Second Brain — Tiago Forte` (type: book, area: Learning/PKM)

#### Validation Rules

1. `resource-type` must be one of the defined enum values.
2. `rating` must be between 1 and 5 inclusive if present.
3. `read-date` must not be in the future.
4. `published-date` must be a valid date if present.
5. `related-knowledge` must link only to `knowledge` type notes if present.
6. `url` must be a valid URL format if present.

---

## Relationship Map

The following diagram shows the primary directional relationships between all object types.

```
                        ┌──────────┐
                        │  area    │◄──────────────────────────┐
                        └────┬─────┘                           │
                             │ has many                        │
              ┌──────────────┼──────────────┐                  │
              ▼              ▼              ▼                  │
         ┌─────────┐   ┌──────────┐  ┌──────────┐             │
         │ project │   │  goal    │  │ business │             │
         └────┬────┘   └────┬─────┘  └────┬─────┘             │
              │              │             │                   │
     has many │   advances ◄─┘    has many │                   │
              ▼                            ▼                   │
         ┌──────┐                   ┌──────────┐               │
         │ task │              ┌────┤  person  ├────┐          │
         └──────┘              │    └──────────┘    │          │
                               │         │          │          │
                        belongs to       │ attends  │ works at │
                               │         ▼          ▼          │
                               │    ┌─────────┐ ┌─────────┐   │
                               │    │ meeting │ │ company │   │
                               │    └────┬────┘ └─────────┘   │
                               │         │                     │
                               │ produces│                     │
                               │         ▼                     │
                        ┌──────┴──────────────────────────┐   │
                        │           decision               │───┘
                        └─────────────────────────────────┘

  knowledge ◄── derived from ── resource
  knowledge ── applies-to ──► area / project / goal

  risk ──────────► project / goal / business
  opportunity ───► area / business ──► decision ──► project

  automation ──► tool
  workflow ──────► tool / automation
  prompt ────────► ai-agent
  ai-agent ──────► tool / prompt

  document ──────► project / business / person / company
  asset ──────────► area / business
  template ──────► [creates] any object type
```

---

## Lifecycle Summary

| Type | Valid Status Values | Terminal State |
|------|---------------------|---------------|
| `area` | `active`, `paused`, `archived` | `archived` |
| `business` | `active`, `paused`, `archived` | `archived` |
| `project` | `draft`, `active`, `paused`, `completed`, `archived` | `archived` |
| `task` | `draft`, `active`, `completed`, `archived` | `archived` |
| `goal` | `draft`, `active`, `completed`, `abandoned`, `archived` | `archived` |
| `knowledge` | `draft`, `active`, `archived` | `archived` |
| `decision` | `active`, `archived` | `archived` |
| `meeting` | `draft`, `completed`, `archived` | `archived` |
| `risk` | `active`, `mitigated`, `materialized`, `expired`, `archived` | `archived` |
| `opportunity` | `draft`, `active`, `pursuing`, `declined`, `archived` | `archived` |
| `asset` | `active`, `archived` | `archived` |
| `tool` | `active`, `paused`, `archived` | `archived` |
| `automation` | `draft`, `active`, `paused`, `archived` | `archived` |
| `workflow` | `draft`, `active`, `paused`, `archived` | `archived` |
| `prompt` | `draft`, `active`, `deprecated`, `archived` | `archived` |
| `ai-agent` | `draft`, `active`, `deprecated`, `archived` | `archived` |
| `person` | `active`, `paused`, `archived` | `archived` |
| `company` | `active`, `archived` | `archived` |
| `document` | `draft`, `active`, `expired`, `superseded`, `archived` | `archived` |
| `template` | `draft`, `active`, `deprecated`, `archived` | `archived` |
| `resource` | `draft`, `active`, `archived` | `archived` |

---

## Global Validation Rules

The following rules apply across all object types.

1. **Type is always required.** Every note must have a `type` property matching exactly one entry in the Object Type Registry.
2. **No note has multiple types.** The `type` property is a single Enum value, never an array.
3. **Dates use ISO 8601.** All date values must follow `YYYY-MM-DD` format.
4. **Links reference valid types.** Frontmatter link properties (e.g., `project`, `area`, `person`) must link to a note of the expected type.
5. **Status must be a valid value.** The `status` value must be within the set of valid values defined for that type's lifecycle.
6. **`completed-date` implies `status: completed`.** Any note with a `completed-date` set must have `status: completed`.
7. **Tags follow the namespace convention.** All tags must use the `#namespace/value` format defined in METADATA_SCHEMA.md.
8. **Titles are unique within a type.** No two active notes of the same type should share an identical `title`.
9. **Notes are never deleted.** Notes transition to `archived` status rather than being deleted, preserving the historical record.
10. **`modified-date` is updated on every edit.** This property is maintained by automation or by the author on every save.
