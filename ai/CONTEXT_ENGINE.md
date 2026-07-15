# LifeOS — Context Engine

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

The Context Engine is responsible for assembling the exact, minimal context payload that each agent needs to complete its task. Agents do not browse the file system. The Context Engine delivers the right information to the right agent at the right time — without duplication and without overloading the agent's context window.

The Context Engine reads from canonical module sources and produces a structured payload. It never copies data; it references it by ID and assembles a view.

---

## Context Assembly Pipeline

```
Task Request
     │
     ▼
1. Identify task_type and agent
     │
     ▼
2. Determine required context dimensions
     │
     ▼
3. Resolve each dimension from its canonical source
     │
     ▼
4. Apply context budget (prevent overload)
     │
     ▼
5. Deliver structured context payload to agent
```

---

## Context Dimensions

Every agent context payload may include any of these dimensions, based on task type:

### 1. Business Context
**Source:** `/businesses/{slug}/README.md` + Business schema  
**Included fields:** `id`, `name`, `status`, `model`, `industry`, `description`, `kpis[]` (summary), `agents[]`  
**When included:** When the task is scoped to a specific business

### 2. Project Context
**Source:** `/projects/{id}/README.md` + Project schema  
**Included fields:** `id`, `title`, `status`, `priority`, `next_action`, `deliverables[]` (summary), `risks[]`, `decisions[]`, `review_date`  
**When included:** When the task is scoped to a specific project

### 3. Knowledge Context
**Source:** `/knowledge/` — selected objects relevant to the task  
**Selection strategy:** Tag matching, domain matching, project cross-reference  
**Included fields:** `id`, `title`, `summary`, `confidence`, `domain`  
**Context budget:** Maximum 5 knowledge objects injected. Full text only for objects with `confidence >= 0.8`. Others: summary only.  
**When included:** All tasks — knowledge is always potentially relevant

### 4. Repository Context
**Source:** `/github/` + GitHub MCP connector  
**Included fields:** `repo_name`, `default_branch`, `open_prs`, `open_issues`, `last_commit`, `ci_status`  
**When included:** Technical tasks (code review, architecture, DevOps, security)

### 5. Related Decisions
**Source:** `/decisions/` — filtered by `project_id` or `business_id`  
**Included fields:** `id`, `title`, `status`, `decision`, `date`, `impact`  
**When included:** When task involves a project or business with linked decisions

### 6. Relevant Meetings
**Source:** `/meetings/` — filtered by `project_id`, `business_id`, or recency  
**Included fields:** `id`, `date`, `title`, `summary`, `action_items[]`  
**Context budget:** Maximum 3 most recent meetings  
**When included:** When task involves active projects with recent meetings

### 7. Relevant Documents
**Source:** `/sops/`, `/docs/`, project-specific documentation  
**Selection strategy:** File path + title matching on task keywords  
**When included:** When task requires process or architectural reference

### 8. Previous Outputs
**Source:** Agent activity log, filtered by `agent_id` + `project_id` or `business_id`  
**Included fields:** `task_type`, `output_summary`, `date`, `confidence_score`  
**Context budget:** Last 3 relevant outputs only  
**When included:** When the task is a continuation of prior work

### 9. Connected MCP Tools
**Source:** `/mcp/registry/` — filtered by agent capabilities and business context  
**Included fields:** `tool_id`, `name`, `status`, `endpoint`  
**When included:** All tasks — agents need to know which tools they may invoke

---

## Context Budget Rules

Agents have finite context windows. The Context Engine enforces a budget:

| Dimension | Max Tokens (estimate) | Priority |
|-----------|----------------------|---------|
| Task instruction | 500 | Required |
| Business context | 300 | Required if scoped |
| Project context | 500 | Required if scoped |
| Knowledge objects | 2,000 | High — summarize if over |
| Related decisions | 400 | Medium |
| Repository context | 200 | Medium — technical tasks |
| Relevant meetings | 300 | Low — 3 max |
| Previous outputs | 400 | Low — 3 max |
| Documents | 1,000 | Low — summaries only |
| Tool manifest | 200 | Required |
| **Total budget** | **~6,000 tokens** | Adjustable per model |

**Overflow strategy:** If assembled context exceeds budget:
1. Truncate Documents to titles only
2. Drop Previous Outputs > 7 days old
3. Drop Meetings > 14 days old
4. Summarize Knowledge objects instead of full text
5. If still over budget: log warning and proceed with truncated context

---

## Context Payload Schema

```json
{
  "task_id": "TSK-XXXX",
  "agent_id": "engineering",
  "task_type": "code_review",
  "assembled_at": "2026-07-04T09:00:00Z",
  "context": {
    "business": {
      "id": "BIZ-0003",
      "name": "ClientVerse",
      "status": "Active",
      "description": "..."
    },
    "project": {
      "id": "PRJ-0019",
      "title": "API v2",
      "status": "Active",
      "next_action": "Merge GraphQL pagination PR",
      "open_risks": 1
    },
    "knowledge": [
      { "id": "KNO-0019", "title": "GraphQL Pagination Patterns", "summary": "...", "confidence": 0.9 }
    ],
    "decisions": [
      { "id": "DEC-0012", "title": "Use GraphQL over REST", "status": "Final", "date": "2026-06-01" }
    ],
    "repository": {
      "name": "clientverse/api",
      "open_prs": 3,
      "last_commit": "2026-07-03"
    },
    "meetings": [],
    "previous_outputs": [
      { "task_type": "code_review", "date": "2026-06-28", "output_summary": "Approved PR #44 with minor comments" }
    ],
    "tools": [
      { "tool_id": "github", "status": "active", "endpoint": "https://api.github.com" }
    ]
  },
  "context_token_estimate": 1840,
  "truncated": false
}
```

---

## Context Freshness

Context is assembled at task dispatch time. Staleness is managed by:

| Dimension | Staleness Rule |
|-----------|---------------|
| Business context | Re-read at every task; never cached |
| Project context | Re-read at every task; never cached |
| Knowledge objects | Re-read at every task; never cached |
| Repository context | Cache for 15 minutes; re-fetch on code tasks |
| Previous outputs | Read from activity log; append-only |

---

## Privacy and Scoping

Context is always scoped to the minimum required for the task:
- A task scoped to Business A never receives context from Business B
- In multi-operator deployments: context is operator-scoped; no cross-operator bleed
- Agent-type decisions (e.g., Legal, Finance) receive only the documents they are authorized to read

---

## Future Extensions

- **Semantic retrieval** — Knowledge objects selected by embedding similarity, not only tags
- **Context quality scoring** — Score how relevant the assembled context is to the task
- **Context caching** — Cache assembled contexts for recurring tasks within a session
- **Operator-customizable context rules** — Operators define which context dimensions each agent receives
- **Context API** — `POST /api/context/assemble` — callable independently of the orchestrator
