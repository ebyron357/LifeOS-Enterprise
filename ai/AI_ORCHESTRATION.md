# LifeOS — AI Orchestration

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

The AI Orchestration Layer is the coordination system that enables specialized agents to work together across the entire LifeOS operating system. It defines how tasks flow between agents, how context is shared, how memory persists, and how humans remain in control of high-stakes decisions.

LifeOS is designed to coordinate hundreds of agents across thousands of projects without hardcoded business logic. Every orchestration decision is driven by metadata, task type, and capability routing rules.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Human sovereignty** | Humans are never replaced as decision makers. Agents propose, recommend, and execute — they do not decide on behalf of the operator on high-stakes matters. |
| **Transparency** | Every agent action is logged. Every orchestration decision is explainable. |
| **Composability** | Agents are independently deployable and combinable. No agent depends on another agent's internals. |
| **Fail-safe** | Agents fail gracefully. Failures surface to the operator, not silently to other agents. |
| **Idempotency** | Retrying a task produces the same result. Agents do not duplicate work. |
| **Audit trail** | All agent interactions are logged with timestamp, agent ID, task ID, input summary, output summary, and confidence score. |
| **Scalability** | The architecture supports scaling from 1 operator + 5 agents to 500 operators + thousands of agents without redesign. |

---

## Architecture Overview

```
Operator Request
      │
      ▼
┌─────────────────────────────────┐
│         ORCHESTRATOR            │
│  (Chief of Staff as primary     │
│   orchestrator + routing logic) │
└──────────────┬──────────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
  ┌─────────┐ ┌───────┐ ┌──────────┐
  │ Context │ │Memory │ │ Approval │
  │ Engine  │ │Engine │ │  Gate    │
  └────┬────┘ └───┬───┘ └────┬─────┘
       │          │          │
       └──────────┼──────────┘
                  ▼
        ┌─────────────────┐
        │  SPECIALIST      │
        │  AGENTS          │
        │  (15 agents)     │
        └────────┬─────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
    Tools    Knowledge   Write-back
    (MCP)    (Context)   (Modules)
```

---

## Layer Descriptions

### 1. Orchestrator
The central router. Receives all requests, selects agents, manages execution order, passes context, tracks progress, and returns results. See [ORCHESTRATOR.md](./ORCHESTRATOR.md).

### 2. Context Engine
Assembles the relevant context payload for each agent before task execution. Ensures agents have business context, project state, related knowledge, and tool access — without duplicating information. See [CONTEXT_ENGINE.md](./CONTEXT_ENGINE.md).

### 3. Memory Engine
Manages what agents remember across sessions, projects, and businesses. Defines retention and retrieval strategies at each memory layer. See [MEMORY_ARCHITECTURE.md](./MEMORY_ARCHITECTURE.md).

### 4. Approval Gate
Human-in-the-loop checkpoint. Determines when autonomous execution is appropriate and when human review is required before an agent proceeds. See [APPROVAL_WORKFLOWS.md](./APPROVAL_WORKFLOWS.md).

### 5. Agent Communication Layer
Defines how agents communicate: task delegation, status updates, dependency tracking, escalation, and conflict resolution. See [AGENT_COORDINATION.md](./AGENT_COORDINATION.md).

### 6. Tool Routing
Maps agent task types to the appropriate external tools. Every routing decision is rule-based and explainable. See [TOOL_ROUTING.md](./TOOL_ROUTING.md).

---

## Agent Catalog

LifeOS defines 15 specialized agents. Each agent has a single, well-scoped mission.

| Agent | Type | Mission Summary |
|-------|------|----------------|
| Chief of Staff | Orchestrator | Master orchestrator and daily operator briefing |
| Project Manager | Specialist | Project health, blockers, and next actions |
| Engineering Lead | Builder | Code, architecture, and technical decisions |
| Knowledge Engineer | Analyst | Knowledge object creation and maintenance |
| Research Analyst | Analyst | Deep research and insight synthesis |
| Automation Architect | Builder | Automation design and maintenance |
| Marketing Strategist | Specialist | Marketing strategy and content direction |
| Sales Strategist | Specialist | Sales pipeline and revenue strategy |
| Finance Advisor | Analyst | Financial analysis and KPI monitoring |
| Legal Advisor | Reviewer | Legal risk review and compliance guidance |
| UI/UX Designer | Builder | Interface design and user experience |
| QA Engineer | Reviewer | Quality assurance and test coverage |
| DevOps Engineer | Builder | Infrastructure, CI/CD, and deployment |
| Security Advisor | Reviewer | Security review and vulnerability detection |
| Documentation Specialist | Builder | Documentation creation and maintenance |

Full specifications: `/agents/{slug}/README.md`

---

## Orchestration Patterns

### Pattern 1: Single-Agent Task
```
Operator → Orchestrator → [Agent] → Result → Operator
```
Used for: Most tasks. One agent, one task, one output.

### Pattern 2: Sequential Chain
```
Operator → Orchestrator → [Agent A] → output → [Agent B] → Result → Operator
```
Used for: Research → Knowledge Engineer (research findings promoted to knowledge objects).

### Pattern 3: Parallel Fan-Out
```
Operator → Orchestrator → [Agent A] ┐
                          [Agent B] ├── Results merged → Operator
                          [Agent C] ┘
```
Used for: Weekly review (Project Manager + Finance Advisor + Knowledge Engineer run simultaneously).

### Pattern 4: Review Gate
```
Operator → Orchestrator → [Agent A] → Draft Output → [Approval Gate] → Operator Review → [Agent A continues] → Result
```
Used for: Any output that affects production systems, financial data, or irreversible decisions.

### Pattern 5: Escalation
```
[Agent] → Confidence too low → Orchestrator → Approval Gate → Operator → Resolution → [Agent resumes]
```
Used for: Any agent whose confidence score drops below its configured threshold.

---

## Execution States

Every task in the orchestration system has an explicit state:

| State | Meaning |
|-------|---------|
| `queued` | Task received, not yet dispatched |
| `dispatched` | Sent to agent, awaiting start |
| `in_progress` | Agent is actively executing |
| `awaiting_approval` | Paused at human-in-the-loop gate |
| `awaiting_dependency` | Waiting for another task to complete |
| `completed` | Output delivered and logged |
| `failed` | Agent failed; surfaced to operator |
| `cancelled` | Operator or system cancelled the task |
| `retrying` | Failed task is being retried |

---

## API Contract (Future)

```
POST /api/orchestrator/tasks           → Submit a new task
GET  /api/orchestrator/tasks/{id}      → Get task status
POST /api/orchestrator/tasks/{id}/approve   → Approve at approval gate
POST /api/orchestrator/tasks/{id}/reject    → Reject at approval gate
POST /api/orchestrator/tasks/{id}/cancel    → Cancel task
GET  /api/orchestrator/activity        → Agent activity log
GET  /api/orchestrator/queue           → Current task queue
```

---

## Future Extensions

- **Dynamic agent spawning** — Orchestrator creates sub-agents for parallelizable sub-tasks
- **Agent performance feedback** — Operator ratings improve routing decisions over time
- **Cross-tenant orchestration** — In SaaS mode, orchestration is fully isolated per tenant
- **Agent marketplace routing** — Orchestrator routes to community agents from the marketplace
- **Cost-aware routing** — Orchestrator selects lower-cost models when quality requirements allow
