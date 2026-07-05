# Automation

## Overview

This directory defines automation patterns, trigger categories, and the automation engine specification for LifeOS Enterprise Phase 6.

---

## What Is Automation?

Automation in LifeOS Enterprise allows operators to define rules that run automatically in response to events or on a schedule. Automations reduce routine coordination overhead and ensure consistent operational behavior.

---

## Automation Categories

### 1. Event-Triggered Automations
Fired when a domain event occurs on the event bus.

| Category | Example Triggers |
|----------|----------------|
| Task lifecycle | Task created, completed, overdue, assigned |
| Project lifecycle | Project created, stalled, completed |
| Contact lifecycle | Contact created, linked to project |
| Deal lifecycle (Alternative) | Deal stage changed, deal passed |
| Engagement lifecycle (ClientVerse) | Engagement at risk, milestone overdue |
| Agent actions | Agent action queued, completed, failed |

### 2. Scheduled Automations
Fired on a time schedule (cron expression).

| Pattern | Example |
|---------|---------|
| Daily digest | Morning brief at 08:00 |
| Weekly review | Pipeline review every Monday |
| Monthly report | Client invoicing summary on 1st |
| Deadline check | Scan for approaching milestones daily |

### 3. Manual Automations
Triggered by the operator on demand, with an optional target entity.

| Pattern | Example |
|---------|---------|
| Generate status update | Operator clicks "Generate Update" on engagement |
| Bulk task creation | Operator applies a project template |
| Onboarding checklist | Operator adds a new client contact |

---

## Automation Action Types

| Action | Description |
|--------|-------------|
| `create_task` | Create a new task with defined parameters |
| `update_field` | Update a field on a specified entity |
| `send_notification` | Send a notification via configured channel (in-app, Slack, email) |
| `invoke_agent` | Trigger a specific agent with defined input |
| `webhook` | POST to an external URL with defined payload |
| `create_note` | Create a note and link it to an entity |
| `create_decision` | Create a decision record |

---

## Safety Constraints

- Automations cannot trigger themselves (no self-referential triggers)
- Automations that have generated errors in > 10% of runs in the past hour are auto-paused
- Maximum 100 automation executions per business unit per hour
- Automations are logged — every execution is auditable
- All automation-created entities are tagged `created_by: automation:{id}`

---

## Automation vs. Agent

| | Automation | Agent |
|--|-----------|-------|
| Intelligence | Rule-based | LLM reasoning |
| Trigger | Event or schedule | Event, schedule, or natural language |
| Predictability | Deterministic | Probabilistic (confidence score) |
| Use case | Routine, repetitive tasks | Context-sensitive, nuanced tasks |
| Approval | Never requires approval | May require approval |

Automations and agents are complementary. Common pattern: an automation triggers an agent, which performs a task requiring reasoning.

---

## Related Documents

- [PRD-006: Automation](../docs/product/prd/PRD-006-automation.md)
- [Workflows](../workflows/README.md)
- [Agent Framework](../agents/README.md)
- [Event Schemas](../docs/schemas/event-schemas.md)
