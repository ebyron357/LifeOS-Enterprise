# Alternative

## Overview

Alternative manages alternative investment deal flow, due diligence, investor relationships, and fund reporting within LifeOS Enterprise. It is structured around a deal pipeline with investor CRM capabilities.

---

## Domain

- **Deal types:** Private equity, venture capital, real estate, credit, hedge fund co-investment
- **Stages:** Sourcing → Screening → Due Diligence → Term Sheet → Closing → Portfolio → Exited/Passed
- **Investors:** LPs, co-investors, lead investors, advisors

---

## Core Entities (Domain Extensions)

### Deal (extends Project)
Additional fields:
- `dealType: "pe" | "vc" | "re" | "credit" | "co_invest" | "other"`
- `stage: "sourcing" | "screening" | "due_diligence" | "term_sheet" | "closing" | "portfolio" | "exited" | "passed"`
- `targetSize: number` (USD)
- `targetReturn: string` (e.g., "15% IRR")
- `leadInvestorId?: ContactId`
- `fundId?: string`
- `closingDate?: string`

### InvestorRelationship (new entity, links Contact to Deal)
```
contactId: ContactId
dealId: ProjectId
role: "lead" | "co_investor" | "lp" | "advisor" | "gp"
commitmentAmount?: number
status: "interested" | "in_diligence" | "committed" | "passed"
```

---

## Integration Requirements

- **Data Room (read-only):** Links to external data room documents (Intralinks, Datasite, Box)
- **Accounting (read-only):** Fund-level portfolio summary from accounting system
- LifeOS stores deal notes, DD documents (as Notes), and relationship records — not financial transaction data

---

## Pipeline View Requirements

- Kanban view with one column per pipeline stage
- Each card shows: deal name, type, size, stage, days in stage, lead investor
- Filter by: deal type, size range, asset class, lead investor
- Sort by: date added, deal size, days in current stage

---

## AI Agent Use Cases (Phase 3+)

1. **Weekly Pipeline Brief:** Summary of active deals, stage movements, overdue DD items
2. **Investor Matcher:** Suggests which investors to contact for a new deal based on past deals
3. **DD Checklist Generator:** Creates standard due diligence task lists for new deals

---

## PRD Reference

[PRD-005: Business Modules — Alternative](../../docs/product/prd/PRD-005-business-modules.md#module-alternative)
