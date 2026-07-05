# PRD-006: Automation

**Status:** Draft
**Phase:** 6
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

The Automation phase introduces a workflow engine that allows operators to define event-triggered and scheduled automations without code. Automations connect platform events to actions — creating tasks, notifying channels, updating records, or invoking agents.

---

## Goals

1. Operators can define automations via a visual or YAML-based interface
2. Automations trigger on platform events (entity created, status changed, date arrived)
3. Automations can perform actions: create task, update field, send notification, invoke agent
4. Automation execution is logged and auditable
5. 10+ pre-built automation templates are available out of the box

---

## Automation Model

```
Automation = {
  trigger: Trigger,
  conditions: Condition[],
  actions: Action[],
  enabled: boolean,
  last_run: timestamp
}

Trigger =
  | { type: "event", event: DomainEvent }
  | { type: "schedule", cron: string }
  | { type: "manual" }

Condition = { field: string, operator: string, value: any }

Action =
  | { type: "create_task", params: TaskParams }
  | { type: "update_field", entity_id: EntityRef, field: string, value: any }
  | { type: "send_notification", channel: NotificationChannel, message: string }
  | { type: "invoke_agent", agent_id: string, input: string }
  | { type: "webhook", url: string, payload: object }
```

---

## Pre-Built Templates

| Template | Trigger | Action |
|----------|---------|--------|
| Overdue task escalation | Task due date passed + not complete | Create follow-up task; notify operator |
| Project stall alert | No task activity for N days | Notify operator; suggest next action |
| New contact welcome | Contact created | Create onboarding task checklist |
| Invoice overdue reminder | Invoice due date passed | Create collection task; notify |
| Weekly project review | Every Monday 09:00 | Invoke Morning Brief for each project |
| Deal stage change notification | Deal stage updated | Notify linked team members |
| Milestone approaching | Milestone due in 3 days | Create reminder task |
| Client health check | Weekly | Invoke client health agent |
| GitHub PR stale | PR open > 5 days | Flag in project view; create review task |
| Expense approval required | Expense created above threshold | Route to approval workflow |

---

## User Stories

- As an operator, I can enable a pre-built automation template with one click
- As an operator, I can customize a template's trigger conditions and actions
- As an operator, I can create a custom automation from scratch using a form builder
- As an operator, I can view the execution history of any automation
- As an operator, I can pause or disable an automation without deleting it
- As an operator, I can test an automation with a simulated trigger before enabling it

---

## Acceptance Criteria

### AC-001: Automation Engine
- [ ] Automation execution is idempotent (same event does not trigger duplicate execution)
- [ ] Automation execution latency: ≤ 5 seconds from trigger event to action completion
- [ ] Failed automations are retried up to 3 times with exponential backoff
- [ ] Execution log includes: automation ID, trigger, conditions evaluated, actions taken, status, duration

### AC-002: Templates
- [ ] All 10 templates listed above are available on first install
- [ ] Templates are parameterized (no hardcoded values)
- [ ] Template library is extensible (new templates added without schema changes)

### AC-003: Custom Automations
- [ ] Operators can create automations using UI only (no code required)
- [ ] YAML export/import supported for power users
- [ ] Automation validator prevents common errors (circular triggers, missing required fields)

### AC-004: Safety
- [ ] Automations cannot modify their own trigger conditions (prevents infinite loops)
- [ ] Maximum 100 automation executions per hour per business unit (configurable)
- [ ] Operator receives alert if automation error rate exceeds 10% in a 1-hour window
