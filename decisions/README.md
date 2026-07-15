# Decisions

## Purpose
The Decisions module is the canonical repository for every significant decision made across all businesses and projects in LifeOS. Decisions are immutable records. They explain what was decided, why, by whom, and what impact the decision has.

## Why Record Decisions?
- Prevent re-debating settled questions
- Give AI agents context for execution
- Enable review at defined intervals
- Maintain accountability
- Surface reversals and supersessions

## Structure
```
decisions/
├── README.md                   # This file
├── _templates/
│   └── decision.md             # Blank decision template
├── strategic/                  # Business-level strategic decisions
├── architectural/              # Technology and system design decisions
├── operational/                # Process and workflow decisions
├── product/                    # Product and feature decisions
└── agent/                      # AI agent behavior and policy decisions
```

## Decision Types

| Type | Folder | Examples |
|------|--------|---------|
| Strategic | `strategic/` | Market entry, business model pivot, partnership |
| Architectural | `architectural/` | Database choice, framework, infrastructure |
| Operational | `operational/` | Review cadence, tool choice, team process |
| Product | `product/` | Feature prioritization, scope, launch timing |
| Agent | `agent/` | Agent trust levels, autonomy rules, model selection |

## Decision Lifecycle

```
Proposed → Final → (Reversed | Superseded)
```

| Status | Meaning |
|--------|---------|
| `Proposed` | Logged but not finalized. May be blocking work. |
| `Final` | Made. Linked work may proceed. |
| `Reversed` | Undone. Original record preserved. |
| `Superseded` | Replaced by a newer decision. Both records kept. |

## Naming Convention
`DEC-[YYYY]-[NNN]-[slug].md`

Example: `DEC-2026-001-database-selection.md`

## Cross-References
- Decisions are linked in project files via `decisions[]` metadata
- The Command Center surfaces `Proposed` decisions in the Decision Queue
- The Review Engine includes decision velocity in weekly and monthly reviews
- See [DECISION_ENGINE.md](../docs/DECISION_ENGINE.md) for full framework

## Inputs
- Operator-logged decisions
- AI agent-proposed decisions (always start as `Proposed`)
- Escalated choices from risk registers

## Outputs
- Decision Queue in the Command Center
- Decision Velocity metric in Health Scoring
- Blocker detection in the Execution Engine
- Review prompts during weekly and monthly reviews
