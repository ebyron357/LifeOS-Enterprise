# LifeOS — Memory Architecture

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

Memory in LifeOS is structured as five distinct layers, each with a defined scope, retention strategy, and retrieval method. Together they give agents the context needed to perform complex, multi-session work without losing continuity or consuming unnecessary tokens.

Memory layers are additive. Each layer builds on the one below it. An agent performing a task may draw from all five layers simultaneously, depending on what the task requires.

---

## Memory Layers

```
┌──────────────────────────────────────────────────┐
│  Layer 5: GLOBAL MEMORY                          │
│  Platform-wide patterns, conventions, rules       │
├──────────────────────────────────────────────────┤
│  Layer 4: KNOWLEDGE MEMORY                       │
│  Validated knowledge objects from /knowledge/    │
├──────────────────────────────────────────────────┤
│  Layer 3: BUSINESS MEMORY                        │
│  Business context, KPIs, agents, strategy        │
├──────────────────────────────────────────────────┤
│  Layer 2: PROJECT MEMORY                         │
│  Project history, decisions, outputs, risks      │
├──────────────────────────────────────────────────┤
│  Layer 1: SESSION MEMORY                         │
│  Current conversation and active task            │
└──────────────────────────────────────────────────┘
```

---

## Layer 1 — Session Memory

**Scope:** The active task and conversation turn  
**Duration:** Discarded at session end  
**Size limit:** Full context window of the active model  

### What Belongs Here
- The current task instruction
- Messages exchanged in the current session
- Intermediate reasoning steps
- Draft outputs not yet finalized
- Tool call results from the current session

### Retention Strategy
Session memory is ephemeral. It is not persisted after the session ends. Critical outputs produced during a session must be written to a durable layer (project file, knowledge object, activity log) before the session closes.

### Summarization Strategy
When a session produces valuable insights, the agent must:
1. Summarize the outcome in a structured format
2. Write the summary to the activity log
3. Promote any reusable knowledge to Layer 4

### Retrieval
Not retrieved — it is the live context window.

---

## Layer 2 — Project Memory

**Scope:** All activity associated with a specific project (`PRJ-XXXX`)  
**Duration:** For the life of the project; archived on completion  
**Storage:** `/projects/{id}/` — project files, decision files, deliverable records  

### What Belongs Here
- Project metadata (status, priority, next action, deliverables)
- Decisions linked to the project
- Risk register entries
- Agent outputs scoped to this project
- Meeting notes referencing this project
- Prior task summaries for this project

### Retention Strategy
Project memory is retained until the project is completed and archived. On archive:
- Key decisions are promoted to `/decisions/` with project linkage preserved
- Key learnings are promoted to knowledge objects in Layer 4
- Project file moves to `/archive/`

### Summarization Strategy
The Project Manager agent produces a project retrospective on completion. This becomes a knowledge object in Layer 4.

### Retrieval
Retrieved by `project_id`. The Context Engine injects project memory when a task is scoped to a project.

---

## Layer 3 — Business Memory

**Scope:** All context for a specific business (`BIZ-XXXX`)  
**Duration:** Permanent while the business is active; preserved on pause or close  
**Storage:** `/businesses/{slug}/` — all sub-folders  

### What Belongs Here
- Business identity, model, and description
- KPI definitions and historical actuals
- Strategic decisions
- Business-level risks
- Assigned agents and their configurations
- Financial summaries
- SOP references for this business

### Retention Strategy
Business memory is permanent. Historical KPIs and decisions are never deleted — they may be archived for performance.

### Summarization Strategy
The Finance Advisor agent produces monthly and quarterly summaries injected into the business memory. The Chief of Staff agent produces a business health narrative each week.

### Retrieval
Retrieved by `business_id` or `business_slug`. Injected by the Context Engine for any task scoped to a business.

---

## Layer 4 — Knowledge Memory

**Scope:** Validated, structured knowledge objects in `/knowledge/`  
**Duration:** Permanent; deprecated objects flagged but not deleted  
**Storage:** `/knowledge/{domain}/{id}.md`  

### What Belongs Here
- Validated insights from research
- Technical patterns and architecture decisions
- Process knowledge (how we do X)
- Market and competitive intelligence
- Lessons learned from completed projects
- Agent-generated knowledge that has been reviewed

### Quality Requirements
A knowledge object enters Layer 4 only when:
- It has a `confidence` score >= 0.6
- It has at least one `sources[]` entry
- It has been reviewed by the Knowledge Engineer agent or the operator

### Retention Strategy
Knowledge objects never expire automatically. They are:
- Marked `Needs Review` after 90 days without update
- Promoted to `Deprecated` when superseded by newer knowledge
- Archived (not deleted) on deprecation

### Summarization Strategy
The Knowledge Engineer agent maintains a summary index at `/knowledge/index.md`. Agents receive summaries of knowledge objects (not full text) unless full text is required.

### Retrieval
Retrieved by:
- **Tag matching** — task tags matched against knowledge object tags
- **Domain matching** — task domain matched against knowledge object domain
- **Project cross-reference** — knowledge objects linked to the active project
- **Semantic similarity** (future) — embedding-based retrieval

---

## Layer 5 — Global Memory

**Scope:** Platform-wide rules, conventions, and persistent operator preferences  
**Duration:** Permanent  
**Storage:** `/docs/`, `/ai/`, `/schemas/` — system documentation  

### What Belongs Here
- LifeOS architecture principles and conventions
- Agent behavior rules and escalation policies
- Naming conventions and schema definitions
- Operator-configured global preferences
- Tool routing rules
- Approval workflow policies

### Retention Strategy
Global memory is versioned, not updated in place. Changes create new versions with a changelog.

### Summarization Strategy
Not summarized. Read directly. Global memory is small and structured.

### Retrieval
Injected at agent initialization. The system prompt for every agent includes a pointer to relevant global memory files.

---

## Cross-Layer Promotion

Knowledge moves upward through layers:

```
Session (Layer 1) → Project file (Layer 2)         — Agent writes summary at task end
Project output → Knowledge object (Layer 4)        — Knowledge Engineer promotes on review
Knowledge object → Global convention (Layer 5)     — Operator promotes on deliberate decision
```

Knowledge never moves downward. Global memory does not get copied into session memory — it is injected at initialization.

---

## Memory Anti-Patterns

| Anti-Pattern | Risk | Mitigation |
|-------------|------|-----------|
| Storing everything in session memory | Context overflow, inconsistency | Flush to durable layers before session ends |
| Duplicating project data in knowledge | Drift, stale copies | Cross-reference by ID; never copy |
| No retention policy on knowledge objects | Stale knowledge misleads agents | Mark `Needs Review` at 90 days |
| Injecting full knowledge objects always | Token overload | Inject summaries; full text only when needed |
| Losing session output on close | Work lost, no continuity | Mandate end-of-session write-back protocol |

---

## Future Extensions

- **Vector memory store** — Embeddings for semantic retrieval at scale
- **Cross-project memory** — Identify patterns across multiple project memories
- **Operator-personalized memory** — Per-operator Layer 3/4 views in multi-operator deployments
- **Memory health score** — Track stale, conflicting, and unlinked memory objects
- **Automatic summarization** — Scheduled agent runs that summarize and compress old memory layers
