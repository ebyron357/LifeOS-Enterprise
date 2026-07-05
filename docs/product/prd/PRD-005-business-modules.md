# PRD-005: Business Modules

**Status:** Draft
**Phase:** 5
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

Business Modules add domain-specific views and logic for each of LifeOS Enterprise's three initial businesses: TradeIQ, Alternative, and ClientVerse. Each module extends the core platform with purpose-built data models and workflows.

---

## Module: TradeIQ

**Domain:** Trading intelligence and strategy management

### Goals
- Track trading strategies as structured projects
- Log trades with metadata (instrument, thesis, entry/exit, outcome)
- Surface P&L summaries from connected trading platforms (read-only)
- Link market research notes to strategy projects via knowledge graph

### User Stories
- As a trader, I can create a strategy project with a defined thesis and time horizon
- As a trader, I can log a trade linked to a strategy with entry/exit notes
- As a trader, I can see a summary of open positions from my trading platform
- As a trader, I can search my trade notes for past decisions on any instrument
- As a trader, I receive an AI brief of my strategy performance weekly

### Acceptance Criteria
- [ ] Trade log entries include: instrument, direction, entry price, exit price, size, thesis, outcome notes
- [ ] P&L summary is read from integration — not calculated in LifeOS
- [ ] Strategy projects support custom fields: asset class, time horizon, max drawdown
- [ ] All trade data is business-unit isolated (TradeIQ only)

---

## Module: Alternative

**Domain:** Alternative investment deal management and investor relations

### Goals
- Track investment deals through a defined pipeline (Sourcing → DD → Term Sheet → Closed/Passed)
- Manage investor contacts and their relationship to deals
- Link research documents and decisions to deals via knowledge graph
- Report fund-level summaries (deployment, pipeline, returns) — read-only from source systems

### User Stories
- As an investment manager, I can create a deal and move it through the pipeline
- As an investment manager, I can link investors to a deal and track their status
- As an investment manager, I can attach research notes and DD documents to a deal
- As an investment manager, I can see a pipeline view across all active deals
- As an investment manager, I receive a weekly AI brief on deal pipeline status

### Acceptance Criteria
- [ ] Deal pipeline stages are configurable per fund
- [ ] Investor contacts are linked to deals with a role (Lead, Co-investor, LP, etc.)
- [ ] Deal documents (term sheets, memos) are stored as linked notes
- [ ] Pipeline view filters by: stage, deal size, asset class, lead investor
- [ ] Closed deals are archived but fully searchable

---

## Module: ClientVerse

**Domain:** Client project delivery and relationship management

### Goals
- Manage client engagements as projects with deliverables and milestones
- Track client health (sentiment, responsiveness, outstanding items)
- Generate client-ready status updates from project state
- Link invoicing to project milestones

### User Stories
- As a service provider, I can create a client engagement linked to a contact
- As a service provider, I can define deliverables and milestones for an engagement
- As a service provider, I can generate a client status update from current project state
- As a service provider, I can see which client engagements are at risk (overdue, no activity)
- As a service provider, I receive an AI-generated client health brief weekly

### Acceptance Criteria
- [ ] Client engagements have: client contact, start date, end date, deliverables, budget
- [ ] Milestones have: name, due date, status, linked deliverables
- [ ] Status update generator produces a formatted summary (customizable template)
- [ ] Engagement health score (Green/Yellow/Red) based on: days since last activity, overdue items, open blockers
- [ ] At-risk engagements appear in the operator's daily dashboard

---

## Cross-Module Considerations

- A contact may exist in multiple modules (e.g., an investor who is also a client)
- Cross-module contact merging is handled by the core contact system
- Module-specific fields do not pollute the core entity schema
- Business module data is still business-unit isolated
