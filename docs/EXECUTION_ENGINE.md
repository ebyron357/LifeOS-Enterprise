# LifeOS — Execution Engine

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

The Execution Engine is the central nervous system of LifeOS. It connects every module — businesses, projects, tasks, agents, repositories, knowledge, meetings, decisions, automations — and derives actionable intelligence from their collective metadata without duplicating any data.

The Execution Engine does not store data. It reads metadata from canonical sources across the system and computes signals: priorities, health scores, risks, recommendations, and review prompts. Every signal can be traced back to a source object.

---

## Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Single Source of Truth** | Every value lives in exactly one place. The Engine reads, never writes. |
| **Metadata-Driven** | All computations derive from structured metadata fields defined in the schemas. |
| **No Duplication** | Aggregated views are calculated, not copied. |
| **Fully Traceable** | Every computed signal references the source object(s) that produced it. |
| **Modular** | Each engine component (Priority, ROI, Health, Search) is independently callable. |
| **API-Ready** | Every engine function is defined as a deterministic function over structured input, ready for API implementation. |
| **Extensible** | New signals can be added without modifying existing logic. |

---

## Engine Components

The Execution Engine is composed of seven logical components:

```
execution-engine/
├── priority-engine       # Ranks work by urgency and strategic importance
├── roi-engine            # Calculates expected return on effort
├── blocker-engine        # Identifies blocked and stalled work
├── recommendation-engine # Generates AI-informed action suggestions
├── search-engine         # Universal cross-module search
├── decision-engine       # Records and retrieves decisions
├── review-engine         # Assembles review packets for cadenced reviews
└── health-engine         # Scores system health across dimensions
```

Each component is described in detail in its own documentation file:

| Component | Documentation |
|-----------|--------------|
| Command Center | [COMMAND_CENTER.md](./COMMAND_CENTER.md) |
| Decision Engine | [DECISION_ENGINE.md](./DECISION_ENGINE.md) |
| Review Engine | [REVIEW_ENGINE.md](./REVIEW_ENGINE.md) |
| Search Architecture | [SEARCH_ARCHITECTURE.md](./SEARCH_ARCHITECTURE.md) |
| System Relationships | [SYSTEM_RELATIONSHIPS.md](./SYSTEM_RELATIONSHIPS.md) |
| Health Scoring | [HEALTH_SCORING.md](./HEALTH_SCORING.md) |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOURCE MODULES                           │
│  businesses/ │ projects/ │ agents/ │ github/ │ knowledge/ │ ... │
└──────────────────────────────┬──────────────────────────────────┘
                               │ reads metadata
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXECUTION ENGINE                           │
│  Priority │ ROI │ Blockers │ Health │ Search │ Decisions │ ...  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ outputs signals
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       COMMAND CENTER                            │
│  Daily View │ Priorities │ Recommendations │ Review Prompts     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Priority Engine

### Purpose
Determines which work deserves the operator's attention right now.

### Inputs
Fields read from project and task metadata:

| Field | Schema Source | Weight |
|-------|--------------|--------|
| `priority` | Project.schema.json | High |
| `status` | Project.schema.json | High |
| `review_date` | Project.schema.json | High |
| `dependencies` (blocked) | Project.schema.json | High |
| `deliverables[].due_date` | Project.schema.json | Medium |
| `business_id` → business `status` | Business.schema.json | Medium |
| `risks[]` severity | Risk.schema.json | Medium |
| `next_action` presence | Project.schema.json | Low |

### Calculation Logic

```
priority_score(project) =
  base_score(priority_field)           // Critical=100, High=75, Medium=50, Low=25
  + urgency_modifier(review_date)      // +30 if overdue, +15 if due in 7 days
  + blocker_modifier(dependencies)     // +20 if this project is blocking others
  + risk_modifier(risks)               // +10 per open High risk
  - stale_penalty(updated)             // -10 if not updated in 14+ days
```

### Output Fields
```json
{
  "project_id": "PRJ-XXXX",
  "priority_score": 142,
  "urgency": "Overdue",
  "is_blocking": true,
  "open_risks": 2,
  "last_updated": "2026-06-20",
  "recommended_action": "Review immediately — overdue and blocking 2 projects"
}
```

---

## ROI Engine

### Purpose
Surfaces the work most likely to generate the highest return relative to the effort invested.

### Inputs

| Field | Source |
|-------|--------|
| Business `model` and `status` | Business.schema.json |
| Project `priority` | Project.schema.json |
| KPI target vs. actual delta | businesses/[slug]/kpis/ |
| Automation time-saved estimates | Automation.schema.json |
| Deliverable completion rate | Project.schema.json `deliverables` |

### Calculation Logic

```
roi_score(project) =
  strategic_value(business_status, priority)    // 0–100
  + kpi_impact(linked_kpi_delta)                // 0–50
  + leverage_multiplier(is_automation)          // ×1.5 if automation
  - effort_estimate(deliverable_count)          // -5 per open deliverable
```

### Output Fields
```json
{
  "project_id": "PRJ-XXXX",
  "roi_score": 88,
  "strategic_tier": "High",
  "kpi_impact": "Directly affects Revenue KPI (+15% gap)",
  "leverage_type": "Automation",
  "recommendation": "Prioritize — high strategic value with automation leverage"
}
```

---

## Blocker Engine

### Purpose
Identifies work that cannot proceed due to unresolved dependencies, missing decisions, or stalled agents.

### Inputs

| Signal | Source |
|--------|--------|
| `dependencies` with unresolved status | Project.schema.json |
| `decisions` with status `Proposed` | Decision.schema.json |
| Agent tasks with no recent activity | Agent.schema.json |
| Automation with `status: Failed` | Automation.schema.json |
| Deliverables with status `Blocked` | Project.schema.json |

### Output
```json
{
  "blocked_items": [
    {
      "item_id": "PRJ-0042",
      "blocked_by": "DEC-0012",
      "blocked_by_type": "Decision",
      "blocked_since": "2026-06-18",
      "days_blocked": 16,
      "owner": "Operator",
      "recommended_action": "Make decision DEC-0012 to unblock PRJ-0042"
    }
  ]
}
```

---

## Recommendation Engine

### Purpose
Produces context-aware suggestions based on the current state of all modules.

### Recommendation Types

| Type | Trigger Condition | Example Output |
|------|------------------|---------------|
| `review_due` | `review_date` ≤ today | "PRJ-0023 is due for review" |
| `stale_project` | `updated` > 14 days ago with status `Active` | "PRJ-0041 has no updates in 21 days" |
| `no_next_action` | `next_action` is empty | "PRJ-0017 has no next action defined" |
| `unlinked_knowledge` | Knowledge object with no `projects` or `businesses` | "KNO-0005 is not linked to any project" |
| `agent_idle` | Agent with no tasks in 7 days | "Research agent has had no tasks in 8 days" |
| `automation_failed` | Automation `last_run_status: Failed` | "Automation AUTO-0003 failed last run" |
| `repo_stale` | GitHub repo with no commits in 30 days | "Repository 'clientverse-api' has no commits in 32 days" |
| `decision_needed` | Open risk with no linked decision | "RISK-0007 has no mitigation decision" |

### Output
Recommendations are ordered by urgency and presented in the Command Center daily view.

---

## Integration Points

Every engine component integrates through the canonical module structure:

| Module | Engine Role |
|--------|-------------|
| `/businesses` | Provides business health, KPI targets, and strategic context |
| `/projects` | Primary source for priority, ROI, and blocker calculations |
| `/agents` | Activity monitoring for agent health and idle detection |
| `/github` | Repository health, commit cadence, PR and issue counts |
| `/knowledge` | Knowledge coverage, review scheduling, AI usage tracking |
| `/automations` | Failure detection, time-savings estimation |
| `/decisions` | Decision velocity, open decisions, reversals |
| `/command-center` | Consumes all engine outputs for the daily operator view |

---

## API Contract (Future)

When LifeOS is deployed as an API, each engine component maps to an endpoint:

```
GET /api/engine/priorities          → Priority Engine output
GET /api/engine/roi                 → ROI Engine output
GET /api/engine/blockers            → Blocker Engine output
GET /api/engine/recommendations     → Recommendation Engine output
GET /api/engine/health              → Health Engine output
GET /api/search?q={query}           → Search Engine output
GET /api/decisions/{id}             → Decision record
GET /api/reviews/{cadence}          → Review Engine packet
```

All endpoints return JSON. All responses include `computed_at` timestamp and `sources[]` referencing the input objects.

---

## Future Extensions

- **Real-time computation** — Engine recalculates on every data mutation via event streams
- **AI augmentation** — Recommendation Engine enhanced with LLM-generated analysis
- **Operator feedback loop** — Recommendations marked as acted/dismissed improve future weighting
- **Multi-operator scoring** — Priority scores respect per-operator context and role
- **SaaS isolation** — Engine is tenant-scoped; all calculations are isolated per organization
