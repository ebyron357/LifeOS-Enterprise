# LifeOS — Agent Orchestrator

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

The Orchestrator is the central dispatcher of the LifeOS AI system. It receives every request — from operators, from automations, from other agents — and is responsible for routing, sequencing, context assembly, progress tracking, failure handling, and activity logging.

The Orchestrator is not an agent. It is the infrastructure layer that agents operate within. In the file-based system, the Chief of Staff agent serves as the human-facing orchestrator. When LifeOS is deployed as a platform, the Orchestrator is a dedicated service.

---

## Responsibilities

| Responsibility | Description |
|---------------|-------------|
| **Request reception** | Accept tasks from operator, automation triggers, and agent escalations |
| **Agent selection** | Choose the best-fit agent based on task type and capability registry |
| **Execution ordering** | Determine whether tasks run sequentially, in parallel, or with dependencies |
| **Context assembly** | Invoke the Context Engine to prepare the agent's input payload |
| **Progress tracking** | Maintain task state from `queued` to `completed` or `failed` |
| **Result delivery** | Route outputs to the correct destination module or operator |
| **Failure handling** | Apply retry logic, escalation, or cancellation on failures |
| **Activity logging** | Write a structured log entry for every task dispatched and completed |

---

## Request Types

The Orchestrator handles five classes of requests:

| Type | Source | Examples |
|------|--------|---------|
| **Operator request** | Human | "Prepare a weekly review", "Review this PR", "Research X" |
| **Scheduled trigger** | Automation | Daily briefing at 9am, weekly review on Monday |
| **Event trigger** | Module event | New project created, KPI threshold breached, automation failed |
| **Agent escalation** | Specialist agent | Agent confidence too low, decision required, blocker found |
| **Agent handoff** | Specialist agent | Research Agent → Knowledge Engineer with research output |

---

## Agent Selection Logic

The Orchestrator selects agents by matching task type to agent capabilities:

```
select_agent(task) =
  1. Parse task intent from the request
  2. Look up task_type → agent mapping in the Agent Capability Registry
  3. Check agent status (Active only)
  4. If multiple agents match: select by task priority × agent current load
  5. If no agent matches: escalate to operator with suggested next steps
```

### Agent Capability Registry

| Task Intent | Primary Agent | Secondary Agent |
|-------------|--------------|----------------|
| Daily briefing / weekly review | Chief of Staff | — |
| Project status, blockers | Project Manager | Chief of Staff |
| Code review, architecture | Engineering Lead | Security Advisor |
| Research, competitive analysis | Research Analyst | Knowledge Engineer |
| Create/update knowledge objects | Knowledge Engineer | Research Analyst |
| Automation design, debugging | Automation Architect | DevOps Engineer |
| Marketing content, strategy | Marketing Strategist | — |
| Sales strategy, pipeline | Sales Strategist | — |
| Financial analysis, KPIs | Finance Advisor | — |
| Legal review, contracts | Legal Advisor | — |
| UI/UX design, wireframes | UI/UX Designer | — |
| Test strategy, QA review | QA Engineer | Engineering Lead |
| Infrastructure, CI/CD | DevOps Engineer | Engineering Lead |
| Security audit, vulnerability | Security Advisor | Engineering Lead |
| Documentation creation | Documentation Specialist | Knowledge Engineer |

---

## Execution Ordering

### Sequential (default)
Tasks run one after another. Output from Task A is input for Task B.

**Use when:** Task B depends on Task A's output.

### Parallel
Multiple tasks dispatched simultaneously. Orchestrator waits for all to complete before merging outputs.

**Use when:** Tasks are independent and results need to be combined (e.g., weekly review aggregation).

### Conditional
Task B is dispatched only if Task A's output meets a condition.

**Use when:** Routing depends on the outcome of a prior step.

### Gated
Task pauses and waits for human approval before continuing.

**Use when:** Output is high-stakes, irreversible, or requires operator judgment.

---

## Context Assembly

Before dispatching a task to an agent, the Orchestrator invokes the Context Engine to assemble the context payload:

```json
{
  "task_id": "TSK-0042",
  "agent_id": "engineering",
  "task_type": "code_review",
  "context": {
    "business": { "id": "BIZ-0003", "name": "ClientVerse", "status": "Active" },
    "project": { "id": "PRJ-0019", "title": "API v2", "status": "Active" },
    "repository": "clientverse/api",
    "related_decisions": ["DEC-0012"],
    "relevant_knowledge": ["KNO-0019", "KNO-0022"],
    "tools_available": ["github", "supabase"]
  },
  "input": { "pr_number": 47 },
  "approval_required": false
}
```

Full context assembly rules: see [CONTEXT_ENGINE.md](./CONTEXT_ENGINE.md).

---

## Progress Tracking

Every task has a lifecycle record:

```json
{
  "task_id": "TSK-0042",
  "agent_id": "engineering",
  "task_type": "code_review",
  "state": "completed",
  "created_at": "2026-07-04T09:00:00Z",
  "dispatched_at": "2026-07-04T09:00:01Z",
  "completed_at": "2026-07-04T09:04:33Z",
  "duration_seconds": 272,
  "confidence_score": 0.91,
  "output_destination": "/projects/clientverse-api-v2/",
  "approval_required": false,
  "approval_status": null,
  "retry_count": 0,
  "error": null
}
```

---

## Failure Handling

```
Task fails
    │
    ├── retry_count < max_retries (default: 2)?
    │       └── Yes → Wait backoff_seconds → Retry
    │       └── No → Apply failure policy
    │
    └── Failure policy:
            ├── escalate_to_operator: true → Surface in Command Center
            ├── alternative_agent: set → Re-dispatch to fallback agent
            └── cancel: true → Log failure, notify operator, halt task chain
```

### Default Retry Configuration
| Policy | Value |
|--------|-------|
| Max retries | 2 |
| Backoff | 30 seconds × retry_count |
| Failure escalation | Always escalate to operator after max retries |

---

## Activity Logging

Every dispatched task generates a log entry in `/agents/activity-log/`:

```
YYYY-MM-DD HH:MM:SS | TSK-XXXX | AGT-XXXX | task_type | state | duration | confidence
```

The activity log feeds:
- The AI Activity dashboard
- Agent Performance metrics in the Health Scoring framework
- Weekly and monthly review packets

---

## Future Extensions

- **Orchestrator API** — RESTful task submission and status tracking
- **Priority queue** — Tasks ranked by urgency and operator-configured weights
- **Dependency graph** — Visualize task chains and their execution order
- **Dynamic sub-agent spawning** — Orchestrator creates temporary agents for parallelizable work
- **Cost tracking** — Token usage logged per task for AI cost visibility
- **Multi-operator queues** — In SaaS mode, isolated task queues per operator
