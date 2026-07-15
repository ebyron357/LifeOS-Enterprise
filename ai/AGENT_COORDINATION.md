# LifeOS — Agent Coordination

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

Agent Coordination defines how agents in LifeOS communicate with each other, with the operator, and with the Orchestrator. It covers task delegation, status reporting, dependency tracking, escalation, human approval, conflict resolution, and retry logic.

No agent communicates directly with another agent. All inter-agent communication passes through the Orchestrator, ensuring full visibility and audit trail.

---

## Communication Architecture

```
Agent A
   │
   │  (escalation / handoff / result)
   ▼
ORCHESTRATOR
   │
   │  (dispatch / context / approval gate)
   ▼
Agent B / Human Operator
```

There are no direct agent-to-agent channels. All coordination is mediated.

---

## Communication Primitives

### 1. Task Delegation

**Direction:** Orchestrator → Agent  
**When:** Orchestrator assigns a task based on capability routing  

**Payload:**
```json
{
  "type": "task_delegation",
  "task_id": "TSK-XXXX",
  "agent_id": "engineering",
  "task_type": "code_review",
  "priority": "High",
  "context": { ... },
  "deadline": "2026-07-04T17:00:00Z",
  "approval_required": false
}
```

**Agent response:** Accept (begin execution) or Reject with reason (Orchestrator re-routes).

---

### 2. Status Update

**Direction:** Agent → Orchestrator  
**When:** Task state changes  

**Payload:**
```json
{
  "type": "status_update",
  "task_id": "TSK-XXXX",
  "agent_id": "engineering",
  "state": "in_progress",
  "progress_note": "Reviewed 3 of 5 files. No critical issues found.",
  "updated_at": "2026-07-04T09:12:00Z",
  "confidence": 0.88
}
```

Status updates are written to the activity log and surface in the Command Center.

---

### 3. Task Handoff

**Direction:** Agent → Orchestrator (for re-dispatch to another agent)  
**When:** Agent completes its portion and the output is input for a downstream agent  

**Payload:**
```json
{
  "type": "task_handoff",
  "from_task_id": "TSK-XXXX",
  "from_agent_id": "research",
  "to_agent_type": "knowledge-engineer",
  "handoff_context": {
    "summary": "Research complete. 4 high-confidence findings ready for knowledge objects.",
    "output_location": "/knowledge/draft/2026-07-04-market-research.md"
  }
}
```

The Orchestrator creates a new task (`TSK-XXXY`) for the Knowledge Engineer, inheriting the handoff context.

---

### 4. Escalation

**Direction:** Agent → Orchestrator → Approval Gate or Operator  
**When:** Agent cannot proceed without human input  

**Escalation triggers:**
| Trigger | Example |
|---------|---------|
| Confidence below threshold | Confidence 0.4 on a required decision |
| Task out of scope | Request to execute irreversible action |
| Conflicting information | Two knowledge objects contradict each other |
| Dependency unresolved | Blocked by a Proposed decision |
| Error after retries | 2 failed attempts with different inputs |
| Security concern | Potential vulnerability found requiring operator decision |

**Payload:**
```json
{
  "type": "escalation",
  "task_id": "TSK-XXXX",
  "agent_id": "security-advisor",
  "escalation_reason": "security_concern",
  "severity": "critical",
  "summary": "Found SQL injection vulnerability in auth module. Requires operator decision on disclosure and fix timeline.",
  "options": ["Fix immediately and block deploy", "Fix in next sprint with temporary mitigations"],
  "recommended_option": 0,
  "awaiting_approval": true
}
```

---

### 5. Dependency Tracking

**Direction:** Agent → Orchestrator  
**When:** Agent detects that its task depends on another incomplete task or unresolved decision  

**Payload:**
```json
{
  "type": "dependency_blocked",
  "task_id": "TSK-XXXX",
  "agent_id": "project-manager",
  "blocked_by_type": "decision",
  "blocked_by_id": "DEC-0012",
  "summary": "Cannot finalize project roadmap until database selection decision is resolved."
}
```

The Orchestrator moves the task to `awaiting_dependency` and adds the decision to the Command Center Decision Queue.

---

### 6. Conflict Resolution

**Direction:** Agent → Orchestrator → Operator  
**When:** Two agents produce contradictory outputs for the same artifact  

**Resolution steps:**
1. Second agent detects conflict with prior output
2. Agent escalates conflict with both versions to the Orchestrator
3. Orchestrator surfaces conflict to the operator with a comparison view
4. Operator selects the authoritative version or requests a resolution pass
5. Third agent (Knowledge Engineer or Documentation Specialist) produces a merged, reconciled output

**Payload:**
```json
{
  "type": "conflict",
  "task_id": "TSK-XXXY",
  "agent_id": "knowledge-engineer",
  "conflict_type": "contradictory_knowledge",
  "artifact_id": "KNO-0022",
  "version_a": { "agent": "research", "task_id": "TSK-XXXX", "value": "..." },
  "version_b": { "agent": "knowledge-engineer", "task_id": "TSK-XXXY", "value": "..." },
  "resolution_required": true
}
```

---

### 7. Retry Logic

**Direction:** Orchestrator (internal)  
**When:** Task fails and retry policy allows  

**Retry configuration per task:**
| Setting | Default | Notes |
|---------|---------|-------|
| `max_retries` | 2 | Configurable per task type |
| `retry_delay_seconds` | 30 × retry_count | Exponential-style backoff |
| `retry_on` | `timeout`, `model_error`, `tool_error` | Not on `confidence_too_low` |
| `do_not_retry_on` | `scope_exceeded`, `approval_required` | Escalate instead |

After max retries: task moves to `failed`, escalated to operator.

---

## Agent Communication Standards

### Message IDs
All communication payloads include a `message_id` (UUID) for deduplication and audit.

### Timestamps
All timestamps are ISO 8601 UTC.

### No Side Effects in Escalations
Agents must not write to module files before receiving human approval for high-stakes actions.

### Idempotent Outputs
If the same task is dispatched twice (e.g., after a system restart), the output must be identical. Agents must check for existing outputs before writing new ones.

---

## Activity Log Format

Every coordination event is appended to the activity log:

```
YYYY-MM-DDTHH:MM:SSZ | message_type | task_id | agent_id | state | summary
```

Example:
```
2026-07-04T09:00:01Z | task_delegation  | TSK-0042 | engineering      | dispatched   | Code review: clientverse/api PR #47
2026-07-04T09:04:33Z | status_update    | TSK-0042 | engineering      | completed    | PR approved with 2 comments. Confidence: 0.91
2026-07-04T09:04:34Z | task_handoff     | TSK-0042 | research         | handoff      | → knowledge-engineer: 4 findings ready
```

---

## Future Extensions

- **Pub/Sub event bus** — Replace polling with event-driven agent activation
- **Agent SLA monitoring** — Alert when agents exceed expected task duration
- **Coordination graph** — Visual map of active task chains and agent dependencies
- **Agent load balancing** — Route tasks to available agent instances in high-volume scenarios
- **Cross-tenant agent boundaries** — In SaaS mode, enforce strict tenant isolation in all coordination payloads
