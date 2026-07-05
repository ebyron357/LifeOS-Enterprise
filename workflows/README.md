# Workflows

## Overview

This directory contains workflow definitions for LifeOS Enterprise. Workflows are structured sequences of steps triggered by events, schedules, or manual invocation. They are the foundation of the Automation layer (Phase 6).

---

## Workflow Structure

A workflow definition includes:

```yaml
id: workflow-id
name: Human-readable name
description: What this workflow does
trigger:
  type: event | schedule | manual
  config: { ... }   # type-specific config
conditions:
  - field: entity.property
    operator: eq | neq | gt | lt | contains
    value: ...
steps:
  - id: step-1
    type: create_task | update_field | send_notification | invoke_agent | webhook
    params: { ... }
  - id: step-2
    dependsOn: step-1
    ...
enabled: true | false
```

---

## Workflow Catalog

See [PRD-006: Automation](../docs/product/prd/PRD-006-automation.md) for the full list of pre-built workflow templates.

### WF-001: Overdue Task Escalation
- **Trigger:** Task due date passes + task status is not `complete`
- **Condition:** Task is overdue by > 0 days
- **Steps:** Create follow-up task; notify operator

### WF-002: Project Stall Alert
- **Trigger:** Scheduled (daily 08:00)
- **Condition:** Project has no task activity for > 7 days and status is `active`
- **Steps:** Notify operator with stalled project list

### WF-003: New Contact Welcome
- **Trigger:** `ContactCreated` event
- **Condition:** Contact type is `person`
- **Steps:** Create onboarding task checklist linked to contact

### WF-004: Milestone Approaching
- **Trigger:** Scheduled (daily 08:00)
- **Condition:** Milestone due in ≤ 3 days and status is not `complete`
- **Steps:** Create reminder task; notify engagement owner

### WF-005: Client Health Check
- **Trigger:** Scheduled (weekly Monday 08:00)
- **Condition:** Engagement status is `active`
- **Steps:** Invoke client health agent; surface any Red engagements in operator dashboard

---

## Adding a New Workflow

1. Define the workflow in this catalog (above)
2. Specify the trigger, conditions, and steps precisely
3. Reference any new event types needed (add to [event-schemas.md](../docs/schemas/event-schemas.md))
4. Reference any new agent capabilities needed (add to [agents/README.md](../agents/README.md))
5. Implement as a workflow template in Phase 6

---

## Related Documents

- [PRD-006: Automation](../docs/product/prd/PRD-006-automation.md)
- [Event Schemas](../docs/schemas/event-schemas.md)
- [Agent Framework](../agents/README.md)
