# Core Entity Schemas

## Overview

This document defines the canonical data schemas for all core entities in LifeOS Enterprise. Implementation repositories must use these schemas as their source of truth. Any deviation requires a spec update.

---

## Conventions

- `id` fields use prefixed ULIDs (see [API Standards](../standards/api.md#8-ids))
- Timestamps are UTC ISO 8601
- Optional fields marked with `?`
- Enum values listed as string literals

---

## User

```typescript
type User = {
  id: `usr_${string}`
  email: string                    // unique, lowercase
  displayName: string
  avatarUrl?: string
  timezone: string                 // IANA timezone (e.g., "America/New_York")
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## BusinessUnit

```typescript
type BusinessUnitType = "company" | "venture" | "project" | "personal" | "fund"

type BusinessUnit = {
  id: `bu_${string}`
  ownerId: `usr_${string}`
  name: string                     // unique per owner
  type: BusinessUnitType
  description?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdBy: `usr_${string}`
}
```

---

## Project

```typescript
type ProjectStatus = "active" | "on_hold" | "complete" | "cancelled" | "draft"

type Project = {
  id: `proj_${string}`
  businessUnitId: `bu_${string}`
  name: string
  goal?: string                    // goal statement for the project
  nextAction?: string              // current next action; null triggers warning
  status: ProjectStatus
  statusUpdatedAt: string
  dueDate?: string                 // ISO 8601 date
  completedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdBy: `usr_${string}` | `agent_${string}`
  updatedBy: `usr_${string}` | `agent_${string}`
}
```

---

## Task

```typescript
type TaskStatus = "open" | "in_progress" | "blocked" | "complete" | "cancelled"
type TaskPriority = "urgent" | "high" | "medium" | "low"

type Task = {
  id: `task_${string}`
  businessUnitId: `bu_${string}`
  projectId: `proj_${string}`
  parentTaskId?: `task_${string}`  // for subtasks (one level deep only)
  title: string
  description?: string             // rich text (markdown)
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string                 // ISO 8601 datetime
  completedAt?: string
  assigneeId?: `usr_${string}`
  tags: string[]
  subtaskCount: number             // computed
  completedSubtaskCount: number    // computed
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdBy: `usr_${string}` | `agent_${string}`
  updatedBy: `usr_${string}` | `agent_${string}`
}
```

---

## Contact

```typescript
type ContactType = "person" | "company"

type Contact = {
  id: `ctc_${string}`
  businessUnitId: `bu_${string}`
  type: ContactType
  name: string
  email?: string
  phone?: string
  company?: string                 // for person contacts: their employer
  website?: string                 // for company contacts
  industry?: string
  notes?: string
  tags: string[]
  linkedProjectIds: `proj_${string}`[]   // computed from relationships
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdBy: `usr_${string}` | `agent_${string}`
  updatedBy: `usr_${string}` | `agent_${string}`
}
```

---

## Note

```typescript
type Note = {
  id: `note_${string}`
  businessUnitId: `bu_${string}`
  title: string
  body: string                     // markdown
  linkedEntities: EntityRef[]      // links to projects, tasks, contacts, etc.
  tags: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdBy: `usr_${string}` | `agent_${string}`
  updatedBy: `usr_${string}` | `agent_${string}`
}

type EntityRef = {
  entityType: "project" | "task" | "contact" | "note" | "decision"
  entityId: string
}
```

---

## Decision

```typescript
type Decision = {
  id: `dec_${string}`
  businessUnitId: `bu_${string}`
  title: string
  context: string                  // what problem this decision addresses
  optionsConsidered: string        // options that were evaluated
  chosenOption: string             // what was decided
  rationale: string                // why this option was chosen
  linkedEntities: EntityRef[]
  lockedAt?: string                // set 24h after creation; immutable after this
  createdAt: string
  updatedAt: string
  createdBy: `usr_${string}` | `agent_${string}`
}
```

---

## Agent

```typescript
type Agent = {
  id: `agent_${string}`
  businessUnitId?: `bu_${string}` | null   // null = platform-level agent
  name: string
  description: string
  enabled: boolean
  model: string                    // e.g., "gpt-4o", "claude-3-5-sonnet-20241022"
  mcpServers: string[]             // list of MCP server IDs this agent has access to
  confidenceThreshold: number      // 0–1; actions below this route to human approval
  triggerType: "scheduled" | "event" | "manual"
  cronExpression?: string          // for scheduled agents
  triggerEvent?: string            // for event-driven agents
  createdAt: string
  updatedAt: string
  createdBy: `usr_${string}`
}
```

---

## AgentAction

```typescript
type AgentActionStatus = "pending" | "approved" | "executed" | "rejected" | "failed" | "undone"

type AgentAction = {
  id: `aa_${string}`
  agentId: `agent_${string}`
  businessUnitId: `bu_${string}`
  status: AgentActionStatus
  actionType: string               // e.g., "create_task", "create_note"
  inputSummary: string             // human-readable description of input
  outputSummary: string            // human-readable description of output
  confidence: number               // 0–1
  approvedBy?: `usr_${string}`
  approvedAt?: string
  executedAt?: string
  undoneAt?: string
  undoneBy?: `usr_${string}`
  failureReason?: string
  createdAt: string
}
```

---

## Automation

```typescript
type TriggerType = "event" | "schedule" | "manual"
type ActionType = "create_task" | "update_field" | "send_notification" | "invoke_agent" | "webhook"

type Automation = {
  id: `auto_${string}`
  businessUnitId: `bu_${string}`
  name: string
  description?: string
  enabled: boolean
  triggerType: TriggerType
  triggerConfig: Record<string, unknown>   // type-specific trigger configuration
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  lastRunAt?: string
  lastRunStatus?: "success" | "failure"
  runCount: number
  createdAt: string
  updatedAt: string
  createdBy: `usr_${string}`
}

type AutomationCondition = {
  field: string
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains"
  value: unknown
}

type AutomationAction = {
  type: ActionType
  params: Record<string, unknown>  // type-specific action parameters
  order: number
}
```
