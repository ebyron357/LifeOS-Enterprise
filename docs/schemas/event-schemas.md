# Event Schemas

## Overview

All domain events emitted by the LifeOS Enterprise platform are defined here. Events are the backbone of the event-driven architecture and are consumed by read models, agents, automations, and integrations.

---

## Event Envelope

Every event conforms to this envelope:

```typescript
type DomainEvent<T = unknown> = {
  eventId: `evt_${string}`
  eventType: string               // e.g., "TaskCreated"
  entityId: string                // ID of the primary entity
  entityType: string              // entity type name
  businessUnitId: `bu_${string}`
  occurredAt: string              // UTC ISO 8601
  actorId: string                 // usr_... or agent:agent_...
  schemaVersion: string           // e.g., "1.0"
  payload: T
}
```

---

## User Events

### UserRegistered
```typescript
{
  userId: string
  email: string
}
```

### UserEmailVerified
```typescript
{
  userId: string
}
```

### UserPasswordChanged
```typescript
{
  userId: string
}
```

---

## BusinessUnit Events

### BusinessUnitCreated
```typescript
{
  businessUnitId: string
  name: string
  type: BusinessUnitType
  ownerId: string
}
```

### BusinessUnitArchived
```typescript
{
  businessUnitId: string
  archivedBy: string
}
```

---

## Project Events

### ProjectCreated
```typescript
{
  projectId: string
  name: string
  goal?: string
  nextAction?: string
  status: ProjectStatus
}
```

### ProjectStatusUpdated
```typescript
{
  projectId: string
  previousStatus: ProjectStatus
  newStatus: ProjectStatus
}
```

### ProjectNextActionUpdated
```typescript
{
  projectId: string
  previousNextAction: string | null
  newNextAction: string | null
}
```

### ProjectNextActionCleared
```typescript
{
  projectId: string
  clearedBy: string
}
```

### ProjectCompleted
```typescript
{
  projectId: string
  completedAt: string
}
```

### ProjectArchived
```typescript
{
  projectId: string
  archivedBy: string
}
```

---

## Task Events

### TaskCreated
```typescript
{
  taskId: string
  projectId: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  assigneeId?: string
}
```

### TaskStatusUpdated
```typescript
{
  taskId: string
  previousStatus: TaskStatus
  newStatus: TaskStatus
}
```

### TaskCompleted
```typescript
{
  taskId: string
  completedAt: string
  completedBy: string
}
```

### TaskDueDateChanged
```typescript
{
  taskId: string
  previousDueDate: string | null
  newDueDate: string | null
}
```

### TaskAssigned
```typescript
{
  taskId: string
  previousAssigneeId: string | null
  newAssigneeId: string
}
```

### TaskOverdue
```typescript
{
  taskId: string
  dueDate: string
  assigneeId?: string
}
```

---

## Contact Events

### ContactCreated
```typescript
{
  contactId: string
  type: ContactType
  name: string
}
```

### ContactLinkedToProject
```typescript
{
  contactId: string
  projectId: string
}
```

---

## Note Events

### NoteCreated
```typescript
{
  noteId: string
  title: string
  linkedEntities: EntityRef[]
}
```

### NoteUpdated
```typescript
{
  noteId: string
  titleChanged: boolean
  bodyChanged: boolean
}
```

---

## Agent Events

### AgentActionQueued
```typescript
{
  agentActionId: string
  agentId: string
  actionType: string
  confidence: number
  requiresApproval: boolean
}
```

### AgentActionApproved
```typescript
{
  agentActionId: string
  approvedBy: string
}
```

### AgentActionExecuted
```typescript
{
  agentActionId: string
  actionType: string
  resultEntityId?: string
}
```

### AgentActionRejected
```typescript
{
  agentActionId: string
  rejectedBy: string
}
```

### AgentActionUndone
```typescript
{
  agentActionId: string
  undoneby: string
}
```

---

## Automation Events

### AutomationTriggered
```typescript
{
  automationId: string
  triggerType: TriggerType
  triggerDetails: Record<string, unknown>
}
```

### AutomationCompleted
```typescript
{
  automationId: string
  actionsExecuted: number
  durationMs: number
}
```

### AutomationFailed
```typescript
{
  automationId: string
  failedAtStep: number
  errorCode: string
  errorMessage: string
}
```

---

## Event Versioning

When an event's payload schema changes in a breaking way:
1. The `schemaVersion` field is incremented (e.g., `"1.0"` → `"2.0"`)
2. Consumers must handle both versions during the transition period
3. Old version events are not emitted after all consumers are updated
4. Breaking event changes are documented in the [release changelog](../release/release-process.md)
