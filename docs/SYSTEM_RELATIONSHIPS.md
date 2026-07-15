# LifeOS — System Relationships

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

Every object in LifeOS knows its relationships. No object exists in isolation. The relationship graph defines how data flows through the system, how the Execution Engine derives signals, and how the operator navigates from any object to any related object without losing context.

This document defines the relationship rules, hierarchy, and cross-linking conventions for all LifeOS modules.

---

## Relationship Hierarchy

The primary ownership hierarchy flows from top to bottom. Each level owns the levels below it:

```
Business
  └── Projects
        └── Tasks / Deliverables
              └── Knowledge Objects
                    └── Meetings / Decisions
                          └── Repositories
                                └── AI Agents
                                      └── Automations
                                            └── Dashboards
```

Higher-level objects may have references to lower-level objects via ID arrays. Lower-level objects hold a single `parent_id` reference pointing upward. Lateral relationships (e.g., Knowledge ↔ Decision) are stored as arrays on both sides.

---

## Entity Relationship Rules

### Business → Project
- A Business contains one or more Projects
- Every Project must have exactly one `business_id`
- Business schema stores `projects[]` as an array of `PRJ-XXXX` IDs
- **Rule:** No project exists without a parent business

### Project → Deliverable / Task
- A Project contains one or more Deliverables
- Deliverables are embedded in the Project schema (`deliverables[]`)
- **Rule:** Every active project must have at least one deliverable with a due date

### Project → Knowledge
- Projects generate and consume Knowledge Objects
- Project schema stores `knowledge[]` as an array of `KNO-XXXX` IDs (future schema extension)
- Knowledge schema stores `projects[]` as an array of `PRJ-XXXX` IDs
- **Rule:** Every completed project should produce at least one knowledge object (lessons learned)

### Project → Decision
- Projects surface decisions that must be resolved to proceed
- Project schema stores `decisions[]` as an array of `DEC-XXXX` IDs
- Decision schema stores `project_id` pointing back
- **Rule:** An unresolved Decision blocks its linked Project

### Project → Repository
- A Project may link to one or more GitHub repositories
- Project schema stores `github_repo` (single URL) — future: `github_repos[]` for multi-repo
- **Rule:** Repository health is reflected in Project health

### Knowledge → Meeting
- Meetings produce Knowledge Objects
- Meeting schema stores `knowledge_produced[]` as an array of `KNO-XXXX` IDs
- Knowledge schema stores `sources[]` which may reference meeting records
- **Rule:** Key meeting outcomes should be promoted to knowledge objects

### Knowledge → Decision
- Decisions are a specialized type of knowledge
- High-impact Final decisions may be promoted to Knowledge Objects
- **Rule:** Architectural and strategic decisions should have a linked knowledge object

### Agent → Project / Business
- Agents are assigned to projects and businesses
- Agent schema stores `assigned_projects[]` and `assigned_businesses[]`
- Project schema stores `ai_owner` (single agent) — future: `agents[]` for multi-agent
- Business schema stores `agents[]`
- **Rule:** Every active project should have an assigned AI agent

### Agent → Automation
- Automations may trigger or be triggered by agents
- Automation schema stores `agent_id` if agent-initiated
- **Rule:** Agent-initiated automations are logged in the agent's activity record

### Repository → Agent
- Agents may interact with repositories (read, commit, create PRs)
- Repository records store `assigned_agents[]`
- **Rule:** Repository write access is scoped to explicitly assigned agents

### Automation → Workflow / Agent / Project
- Automations execute workflows, trigger agents, or update project status
- Automation schema stores `target_type` and `target_id`
- **Rule:** Every automation must reference a valid target object

---

## Cross-Link Implementation

In the file-based system, cross-links are implemented through:

1. **Metadata frontmatter** — YAML/JSON metadata at the top of each Markdown file contains ID arrays for related objects
2. **Schema validation** — JSON schemas enforce that ID references follow the correct pattern (e.g., `PRJ-XXXX`)
3. **Index files** — `knowledge/index.md` and similar index files maintain a human-readable cross-reference table
4. **Template fields** — Every template includes the standard relationship fields in its metadata section

---

## Relationship Rules Summary

| Relationship | Cardinality | Direction | Blocking? |
|-------------|-------------|-----------|-----------|
| Business → Project | 1:many | Owned | No |
| Project → Deliverable | 1:many | Embedded | No |
| Project → Decision | 1:many | Referenced | Yes (if Proposed) |
| Project → Knowledge | many:many | Referenced | No |
| Project → Repository | 1:many | Referenced | No |
| Project → Agent | 1:many | Referenced | No |
| Project → Automation | 1:many | Referenced | No |
| Knowledge → Decision | many:many | Referenced | No |
| Knowledge → Meeting | many:many | Referenced | No |
| Agent → Automation | 1:many | Referenced | No |
| Agent → Repository | many:many | Referenced | No |
| Business → Agent | 1:many | Referenced | No |
| Business → Repository | 1:many | Referenced | No |

---

## Orphan Detection

An orphaned object is one with no valid parent reference. The Execution Engine detects:

| Object Type | Orphan Condition | Action |
|-------------|-----------------|--------|
| Project | No valid `business_id` | Flag in Command Center |
| Knowledge | No `projects[]` or `businesses[]` | Surface in Recommendations |
| Decision | No `project_id` or `business_id` | Flag as unscoped |
| Agent | No `assigned_projects[]` or `assigned_businesses[]` | Flag as idle |
| Automation | No valid `target_id` | Flag as disconnected |

---

## Relationship Visualization

The relationship graph for a single Project looks like:

```
Business: ClientVerse (BIZ-0003)
│
└── Project: API v2 (PRJ-0042)
      ├── Deliverables: DEL-001, DEL-002, DEL-003
      ├── Decisions: DEC-0012 (Proposed — BLOCKING)
      ├── Knowledge: KNO-0019 (GraphQL Patterns)
      ├── Repository: clientverse/api
      ├── Agent: Engineering Lead
      └── Automation: AUTO-0007 (CI/CD Deploy)
```

---

## Future Extensions

- **Relationship API** — `GET /api/{entity_type}/{id}/relationships` returns the full relationship graph
- **Visual graph** — Interactive relationship map in the LifeOS web interface
- **Impact analysis** — "What is affected if I archive this project?" query on the relationship graph
- **Relationship validation** — Automated CI check that all ID references resolve to existing objects
- **Cascade rules** — When a business is archived, surface all linked orphaned objects for review
