# ClientVerse

## Overview

ClientVerse manages client relationships, service engagements, deliverable tracking, and invoicing within LifeOS Enterprise. It is a client delivery platform built on the core project and contact system.

---

## Domain

- **Client types:** Enterprise, SMB, individual
- **Engagement types:** Retainer, project-based, advisory, productized service
- **Deliverable types:** Report, software, strategy, design, consultation

---

## Core Entities (Domain Extensions)

### Engagement (extends Project)
Additional fields:
- `clientContactId: ContactId`
- `engagementType: "retainer" | "project" | "advisory" | "productized"`
- `startDate: string`
- `endDate?: string`
- `budget: number` (USD)
- `billedToDate: number` (computed from linked invoices)
- `healthScore: "green" | "yellow" | "red"` (computed)
- `healthReasons: string[]` (computed — reasons for non-green score)

### Milestone (new entity, linked to Engagement)
```
engagementId: ProjectId
name: string
dueDate: string
status: "pending" | "in_progress" | "complete" | "overdue"
deliverables: string[]
```

---

## Client Health Score Logic

Health score is computed automatically:

| Condition | Impact |
|-----------|--------|
| No activity in > 7 days | Yellow |
| No activity in > 14 days | Red |
| Any overdue milestone | Yellow |
| Any overdue milestone > 7 days | Red |
| Any open blocker task | Yellow |
| No next action on engagement | Yellow |
| Combination of 2+ yellow conditions | Red |

---

## Integration Requirements

- **Finance Integration:** Invoice status linked to milestones; overdue invoices surfaced
- **Calendar Integration:** Client meetings shown in engagement view
- **Email Integration:** Client email threads linked to engagement

---

## Status Update Generator

The status update generator produces a formatted summary from current engagement state:

**Template includes:**
- Project name and client name
- Overall health indicator
- Milestones: completed / in progress / upcoming
- Open items / blockers (non-sensitive)
- Next steps

Output is a Note linked to the engagement, formatted as markdown, ready to send to the client.

---

## AI Agent Use Cases (Phase 3+)

1. **Weekly Client Health Brief:** Summary of all engagement health scores and at-risk items
2. **Status Update Writer:** Generates client status update from current engagement state
3. **Invoice Follow-Up:** Creates follow-up task when invoice is overdue and no contact logged

---

## PRD Reference

[PRD-005: Business Modules — ClientVerse](../../docs/product/prd/PRD-005-business-modules.md#module-clientverse)
