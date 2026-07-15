# LifeOS — Sprint Plan

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect / Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Sprint 1 — Foundation Hardening

### Objectives

- Close the remaining MVP-critical documentation gaps
- Make repository validation enforceable
- Establish a stable foundation for real operator data

### Deliverables

- `docs/NAMING_CONVENTIONS.md`
- `docs/STANDARDS.md`
- `docs/REPOSITORY_GUIDE.md`
- `docs/METADATA_SCHEMA.md`
- GitHub Actions schema validation workflow
- Validation checklist for templates and module READMEs

### Definition of Done

- All MVP-required foundation docs exist
- Schema validation runs automatically in CI
- Top-level module documentation is internally consistent
- A new operator can follow the onboarding docs without missing references

### Dependencies

- None

---

## Sprint 2 — Operator Core

### Objectives

- Turn the repository from a template set into a usable operating system
- Seed the first business, projects, decisions, and knowledge records
- Make daily and weekly review flows executable

### Deliverables

- First real business instance
- First five active projects
- Initial decision log and risk register entries
- Initial knowledge objects linked to projects/businesses
- Completed daily and weekly command-center workflow definitions

### Definition of Done

- One business can be managed entirely inside the repository
- Every active project has an owner, next action, and review date
- Decision and risk capture is in regular use
- Daily and weekly review records can be completed from repository data

### Dependencies

- Sprint 1 foundation assets

---

## Sprint 3 — Connectors and Core Agents

### Objectives

- Stand up the minimum external integration layer
- Make Chief of Staff and Project Manager operational
- Enable the first real AI-assisted operating loop

### Deliverables

- GitHub MCP connector
- Claude or OpenAI MCP connector
- Slack MCP connector
- Chief of Staff operational configuration
- Project Manager operational configuration
- Auth, health-check, and usage instructions for all MVP connectors

### Definition of Done

- Agents can use the model connector and at least one external system
- Chief of Staff can generate a daily briefing from current repository state
- Project Manager can flag stale projects and missing next actions
- Connector health can be checked and failures are visible

### Dependencies

- Sprint 2 real operating data
- Sprint 1 validation and standards

---

## Sprint 4 — Automation and Review Assembly

### Objectives

- Remove manual assembly from the core operating loop
- Implement the first deterministic engines and workflows
- Define the visibility layer for command-center and repository health

### Deliverables

- Daily briefing workflow
- Weekly review packet assembly workflow
- Project stale-item escalation workflow
- Priority/blocker/recommendation engine implementations
- Dashboard specifications for command-center, automation, knowledge, and repository health

### Definition of Done

- Daily briefing can be generated on demand or on schedule
- Weekly review packet assembles from canonical records only
- Stale items and blockers surface automatically
- Dashboard specs are complete enough to drive future rendering work

### Dependencies

- Sprint 3 connectors and agents
- Sprint 2 operator data model

---

## Sprint 5 — MVP Release Gate and Platform Bootstrap

### Objectives

- Prove the repository-first MVP is production-ready
- Capture stabilization work before expanding scope
- Begin post-MVP platform implementation only after the MVP gate passes

### Deliverables

- MVP readiness review against `docs/MVP.md`
- Stabilization fixes for onboarding, validation, workflows, and agent operations
- Initial monorepo scaffold for post-MVP platform work
- Initial CI layout for app/build/test tracks
- Sequenced backlog for auth, database, API, and app-shell implementation

### Definition of Done

- MVP exit criteria are reviewed and explicitly passed
- A single operator can run the documented daily and weekly workflow end-to-end
- The repository-first system is stable enough to be the source of truth
- Platform scaffolding begins only after MVP validation is complete

### Dependencies

- Sprint 4 automation and engine outputs
- Sprint 3 agent and connector operations

---

## Sprint Sequence Summary

| Sprint | Theme | Primary Outcome |
|---|---|---|
| 1 | Foundation Hardening | Validation and governance are enforceable |
| 2 | Operator Core | The repository becomes a usable operating system |
| 3 | Connectors and Core Agents | The first AI-assisted operating loop works |
| 4 | Automation and Review Assembly | The core loop runs with minimal manual assembly |
| 5 | MVP Release Gate and Platform Bootstrap | MVP is validated; post-MVP platform work can begin |
