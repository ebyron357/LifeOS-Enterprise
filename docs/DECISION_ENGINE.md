# LifeOS — Decision Engine

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

The Decision Engine is a reusable framework for recording, retrieving, and acting on decisions across all businesses, projects, and contexts within LifeOS. Every significant choice — whether made by a human operator or an AI agent — is logged as an immutable record that explains the problem, options, choice, and reasoning.

Decisions are not opinions or tasks. They are durable records of choices made at a specific point in time with specific information. Once made, a decision is never deleted — only reversed or superseded.

---

## Why Decisions Matter

Undocumented decisions create invisible technical and organizational debt:
- Teams re-debate settled questions
- Agents lose context between sessions
- Reversals happen without awareness of original reasoning
- Accountability is unclear

The Decision Engine eliminates these failure modes by making every decision a first-class LifeOS object.

---

## Decision Schema

Every decision is defined by the `Decision.schema.json` schema. Key fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID (`DEC-XXXX`) |
| `title` | string | Short decision title |
| `context` | string | Situation that triggered the decision |
| `options_considered` | array | All options evaluated, with pros/cons |
| `decision` | string | The exact choice made |
| `rationale` | string | Why this option was selected |
| `made_by` | string | Human or agent that made the decision |
| `date` | date | Date decision was finalized |
| `status` | enum | `Proposed` / `Final` / `Reversed` / `Superseded` |
| `impact` | enum | `High` / `Medium` / `Low` |
| `reversible` | boolean | Can this decision be undone? |
| `reversal_conditions` | string | Under what conditions should it be reversed? |
| `business_id` | string | Linked business (`BIZ-XXXX`) |
| `project_id` | string | Linked project (`PRJ-XXXX`) |
| `review_date` | date | When should this decision be revisited? |
| `implications` | array | Actions or changes triggered by this decision |

---

## Decision Lifecycle

```
Proposed → Final → (Reversed | Superseded)
```

| Status | Meaning |
|--------|---------|
| `Proposed` | Decision is logged but not yet finalized. Blocks linked work. |
| `Final` | Decision is made. Linked work may proceed. |
| `Reversed` | Decision was undone. Original record is preserved. Reversal is linked. |
| `Superseded` | A newer decision replaces this one. Both records are preserved. |

---

## Decision Types

Decisions in LifeOS are classified by their scope:

| Type | Scope | Examples |
|------|-------|---------|
| **Strategic** | Business-level | "Enter the enterprise market", "Pivot business model" |
| **Architectural** | Technology-level | "Use PostgreSQL", "Adopt microservices" |
| **Operational** | Process-level | "Use Notion for docs", "Weekly review on Mondays" |
| **Product** | Feature-level | "Remove feature X", "Launch in Q3" |
| **Agent** | AI-level | "Trust Research agent output without review", "Use GPT-4 Turbo" |

---

## Decision Repository

All decisions are stored in `/decisions/`:

```
decisions/
├── README.md                       # This file
├── _templates/
│   └── decision.md                 # Blank decision template
├── strategic/                      # Business-level decisions
├── architectural/                  # Technology decisions
├── operational/                    # Process decisions
├── product/                        # Product decisions
└── agent/                          # AI agent decisions
```

Decisions linked to a specific project are also cross-referenced in that project's `decisions[]` metadata array. The canonical record always lives in `/decisions/`.

---

## Decision Template

The full decision template is at `/decisions/_templates/decision.md`. Every decision captures:

1. **Problem** — What situation required a decision?
2. **Options** — What alternatives were evaluated?
3. **Decision** — What was chosen?
4. **Reasoning** — Why was this option selected over the others?
5. **Owner** — Who is accountable?
6. **Date** — When was this decision made?
7. **Business** — Which business does this affect?
8. **Project** — Which project does this affect?
9. **Impact** — High / Medium / Low
10. **Dependencies** — What other decisions or items depend on this?
11. **Review Date** — When should this be revisited?

---

## Decision Engine Logic

### Open Decision Detection

The engine scans all decision files for `status: Proposed` and surfaces them in the Command Center Decision Queue, ordered by `days_open` descending.

### Blocking Analysis

Any project with a `decisions[]` entry that points to a `Proposed` decision is flagged as blocked. The Blocker Engine reads this signal.

### Decision Velocity

Decision velocity measures how quickly the operator resolves `Proposed` decisions to `Final`.

```
decision_velocity = count(Final decisions in last 30 days) / 30
```

This metric appears in the Health Scoring framework. See [HEALTH_SCORING.md](./HEALTH_SCORING.md).

### Review Queue

Decisions with `review_date` ≤ today are surfaced in the Knowledge Review Queue.

---

## AI Agent Integration

AI agents interact with the Decision Engine in three ways:

| Interaction | Agent Behavior |
|-------------|---------------|
| **Proposing** | Agent identifies a decision point, logs it as `Proposed`, and requests operator input |
| **Recommending** | Agent evaluates options and adds structured options_considered with recommendation, but does not finalize |
| **Executing** | After operator finalizes, agent reads the decision and proceeds |

Agents never set `status: Final` without explicit operator confirmation.

---

## Cross-References

The Decision Engine integrates with:

| Module | Relationship |
|--------|-------------|
| `/projects` | Decisions are linked to projects; unresolved decisions block project progress |
| `/businesses` | Strategic decisions are scoped to a business |
| `/agents` | Agents propose and execute decisions |
| `/knowledge` | Key decisions can be promoted to knowledge objects |
| `/command-center` | Open decisions surface in the Decision Queue |
| Review Engine | Decisions are reviewed during weekly and monthly cadences |

---

## Future Extensions

- **Decision search** — Full-text and filter search across all decision records
- **Decision impact graph** — Visual map of how decisions link to each other
- **AI-assisted options analysis** — Agent automatically generates pros/cons for proposed decisions
- **Decision audit log** — Immutable history of all status changes per decision
- **API endpoint** — `GET /api/decisions` returns all decisions; supports filtering by status, business, project, impact
