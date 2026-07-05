# Traceability Matrix

**Document Type:** Reference  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Per release  

---

## Purpose

This matrix provides cross-reference traceability between all major specification artifacts in the `LifeOS-Enterprise` repository. Every major artifact references the ADRs, PRDs, User Stories, Schemas, APIs, Standards, and Release Milestones it depends on.

This matrix is the authoritative reference for understanding dependencies between documents. It must be updated whenever a new document is added or a cross-reference changes.

---

## How to Read This Matrix

Each row represents a document. Columns show what that document depends on (incoming references) and what depends on it (outgoing references). Cross-references are by document path relative to the repository root.

---

## Architecture Decision Records

| ADR | Title | Status | Referenced By | Depends On |
|-----|-------|--------|--------------|------------|
| [ADR-001](../architecture/decisions/ADR-001-spec-first.md) | Specification-First Development | Accepted | All documents in this repository | — |
| [ADR-002](../architecture/decisions/ADR-002-event-driven.md) | Event-Driven Core Platform | Accepted | `docs/schemas/event-schemas.md`, `docs/standards/engineering.md`, `docs/product/prd/PRD-003-ai-agents.md`, `docs/product/prd/PRD-006-automation.md` | ADR-001 |
| [ADR-003](../architecture/decisions/ADR-003-mcp-agents.md) | MCP as Agent Integration Standard | Accepted | `docs/product/prd/PRD-003-ai-agents.md`, `docs/product/prd/PRD-004-mcp-integrations.md`, `mcp/README.md`, `agents/README.md` | ADR-001, ADR-002 |

---

## Product Requirements Documents

| PRD | Title | Phase | Status | Related ADRs | Related User Stories | Related Schemas | Related APIs | Related Release |
|-----|-------|-------|--------|-------------|---------------------|----------------|-------------|----------------|
| [PRD-001](../product/prd/PRD-001-foundation.md) | Foundation | 1 | Draft | ADR-001 | E-101–E-105 (foundation-stories.md) | `core-entities.md` | `docs/api/overview.md`, `docs/api/authentication.md` | `docs/release/v1.0-plan.md` |
| [PRD-002](../product/prd/PRD-002-knowledge-graph.md) | Knowledge Graph | 2 | Draft | ADR-001, ADR-002 | — | `core-entities.md` (Note, Decision) | `docs/api/overview.md` | — |
| [PRD-003](../product/prd/PRD-003-ai-agents.md) | AI Agents | 3 | Draft | ADR-001, ADR-002, ADR-003 | — | `core-entities.md` (Agent, AgentAction) | `docs/api/overview.md` | — |
| [PRD-004](../product/prd/PRD-004-mcp-integrations.md) | MCP Integrations | 4 | Draft | ADR-001, ADR-003 | — | `core-entities.md` (Agent) | `docs/api/overview.md` | — |
| [PRD-005](../product/prd/PRD-005-business-modules.md) | Business Modules | 5 | Draft | ADR-001 | — | `core-entities.md` | `docs/api/overview.md` | — |
| [PRD-006](../product/prd/PRD-006-automation.md) | Automation | 6 | Draft | ADR-001, ADR-002 | — | `core-entities.md` (Automation) | `docs/api/overview.md` | — |
| [PRD-007](../product/prd/PRD-007-saas-platform.md) | SaaS Platform | 7 | Draft | ADR-001 | — | `core-entities.md` | `docs/api/overview.md` | — |

---

## User Stories

| Document | Title | Phase | Related PRD | Related Schemas | Related APIs |
|----------|-------|-------|-------------|----------------|-------------|
| [foundation-stories.md](../product/user-stories/foundation-stories.md) | Foundation User Stories (E-101–E-105) | 1 | PRD-001 | `core-entities.md` (User, BusinessUnit, Project, Task, Contact) | `docs/api/authentication.md`, `docs/api/overview.md` |
| [epics.md](../product/user-stories/epics.md) | Epic Index | All | All PRDs | `core-entities.md` | `docs/api/overview.md` |

---

## Schemas

| Schema | Title | Status | Related PRDs | Related APIs | Related ADRs | Used By |
|--------|-------|--------|-------------|-------------|-------------|---------|
| [core-entities.md](../schemas/core-entities.md) | Core Entity Schemas | Active | PRD-001, PRD-002, PRD-003, PRD-004, PRD-005, PRD-006, PRD-007 | `docs/api/overview.md`, `docs/api/authentication.md` | ADR-001, ADR-002 | All implementation repositories |
| [event-schemas.md](../schemas/event-schemas.md) | Domain Event Schemas | Active | PRD-002, PRD-003, PRD-006 | `docs/api/overview.md` | ADR-002 | Event-driven implementation, AI agents, automation |
| [api-schemas.md](../schemas/api-schemas.md) | API Request/Response Schemas | Active | PRD-001 | `docs/api/overview.md`, `docs/api/authentication.md` | ADR-001 | All API implementation |

---

## API Specifications

| Document | Title | Status | Related PRDs | Related Schemas | Related Standards | Related ADRs |
|----------|-------|--------|-------------|----------------|------------------|-------------|
| [api/overview.md](../api/overview.md) | API Overview & Design Principles | Active | PRD-001–PRD-007 | `core-entities.md`, `api-schemas.md`, `event-schemas.md` | `docs/standards/api.md` | ADR-001, ADR-002 |
| [api/authentication.md](../api/authentication.md) | Authentication API | Active | PRD-001 | `core-entities.md` (User), `api-schemas.md` | `docs/standards/security.md`, `docs/standards/api.md` | ADR-001 |

---

## Standards

| Standard | Title | Status | Related PRDs | Related ADRs | Related Schemas | Applies To |
|----------|-------|--------|-------------|-------------|----------------|-----------|
| [standards/engineering.md](../standards/engineering.md) | Engineering Standards | Active | All | ADR-001, ADR-002 | — | All implementation repositories |
| [standards/security.md](../standards/security.md) | Security Requirements | Active | PRD-001 (AC-001) | ADR-001 | — | All implementation repositories |
| [standards/api.md](../standards/api.md) | API Standards | Active | All | ADR-001 | `api-schemas.md`, `core-entities.md` | All API implementations |
| [standards/data.md](../standards/data.md) | Data Standards | Active | All | ADR-001, ADR-002 | `core-entities.md`, `event-schemas.md` | All data implementations |
| [standards/testing.md](../standards/testing.md) | Testing Standards | Active | All | ADR-001 | — | All implementation repositories |

---

## Design System

| Document | Title | Status | Related PRDs | Related Standards |
|----------|-------|--------|-------------|------------------|
| [design-system/foundations.md](../design-system/foundations.md) | Design Foundations | Active | PRD-001 | `standards/engineering.md` |
| [design-system/tokens.md](../design-system/tokens.md) | Design Tokens | Active | PRD-001 | `standards/engineering.md` |
| [design-system/components.md](../design-system/components.md) | Component Specifications | Active | PRD-001 | `standards/engineering.md` |

---

## Release Documents

| Document | Title | Status | Related PRDs | Related ADRs | Related Schemas | Release Milestone |
|----------|-------|--------|-------------|-------------|----------------|-----------------|
| [release/release-process.md](../release/release-process.md) | Release Process | Active | All | ADR-001 | — | All releases |
| [release/v1.0-plan.md](../release/v1.0-plan.md) | v1.0 Release Plan | Active | PRD-001 | ADR-001 | `core-entities.md`, `api-schemas.md` | v1.0 |

---

## Architecture Documents

| Document | Title | Status | Related ADRs | Related Schemas | Related PRDs |
|----------|-------|--------|-------------|----------------|-------------|
| [architecture/overview.md](../architecture/overview.md) | Architecture Overview | Active | ADR-001, ADR-002, ADR-003 | All | All |
| [architecture/system-context.md](../architecture/system-context.md) | System Context | Active | ADR-001, ADR-002 | All | All |
| [architecture/data-flow.md](../architecture/data-flow.md) | Data Flow | Active | ADR-002 | `core-entities.md`, `event-schemas.md` | PRD-001, PRD-002, PRD-003, PRD-006 |
| [architecture/tech-radar.md](../architecture/tech-radar.md) | Technology Radar | Active | ADR-001, ADR-002, ADR-003 | — | All |

---

## Business Documents

| Document | Title | Status | Related PRDs | Related Schemas |
|----------|-------|--------|-------------|----------------|
| [businesses/TradeIQ/overview.md](../../businesses/TradeIQ/overview.md) | TradeIQ Business Overview | Active | PRD-005 | `core-entities.md` |
| [businesses/Alternative/overview.md](../../businesses/Alternative/overview.md) | Alternative Business Overview | Active | PRD-005 | `core-entities.md` |
| [businesses/ClientVerse/overview.md](../../businesses/ClientVerse/overview.md) | ClientVerse Business Overview | Active | PRD-005 | `core-entities.md` |

---

## Agents & MCP

| Document | Title | Status | Related ADRs | Related PRDs | Related Schemas |
|----------|-------|--------|-------------|-------------|----------------|
| [agents/README.md](../../agents/README.md) | AI Agent Framework | Active | ADR-003, ADR-002 | PRD-003 | `core-entities.md` (Agent, AgentAction) |
| [mcp/README.md](../../mcp/README.md) | MCP Integration Catalog | Active | ADR-003 | PRD-004 | `core-entities.md` (Agent) |

---

## Automation & Workflows

| Document | Title | Status | Related ADRs | Related PRDs | Related Schemas |
|----------|-------|--------|-------------|-------------|----------------|
| [automation/README.md](../../automation/README.md) | Automation Patterns | Active | ADR-002 | PRD-006 | `core-entities.md` (Automation) |
| [workflows/README.md](../../workflows/README.md) | Workflow Definitions | Active | ADR-002 | PRD-006 | `core-entities.md` (Automation) |

---

## Governance Documents

| Document | Title | Status | Related Standards | Related ADRs |
|----------|-------|--------|------------------|-------------|
| [governance/REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md) | Repository Governance | Active | All | ADR-001 |
| [governance/DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md) | Document Lifecycle | Active | All | ADR-001 |
| [governance/CHANGE_CONTROL.md](CHANGE_CONTROL.md) | Change Control | Active | `standards/engineering.md` | ADR-001 |
| [governance/VERSIONING_POLICY.md](VERSIONING_POLICY.md) | Versioning Policy | Active | `standards/engineering.md` | ADR-001 |
| [governance/REVIEW_PROCESS.md](REVIEW_PROCESS.md) | Review Process | Active | All | ADR-001 |
| [governance/DECISION_PROCESS.md](DECISION_PROCESS.md) | Decision Process | Active | All | ADR-001 |
| [governance/QUALITY_GATES.md](QUALITY_GATES.md) | Quality Gates | Active | All | ADR-001 |
| [governance/REPOSITORY_INDEX.md](REPOSITORY_INDEX.md) | Repository Index | Active | All | ADR-001 |

---

## Templates

| Document | Title | Status | Used For |
|----------|-------|--------|---------|
| [templates/adr-template.md](../../templates/adr-template.md) | ADR Template | Active | Authoring new ADRs |
| [templates/prd-template.md](../../templates/prd-template.md) | PRD Template | Active | Authoring new PRDs |
| [templates/user-story-template.md](../../templates/user-story-template.md) | User Story Template | Active | Authoring new user stories |

---

## Dependency Heat Map

The following artifacts are referenced by the most documents and are highest-risk for breaking changes:

| Artifact | Reference Count | Risk Level |
|----------|----------------|-----------|
| `docs/schemas/core-entities.md` | 15+ | 🔴 Critical |
| `docs/standards/engineering.md` | 10+ | 🔴 Critical |
| `docs/api/overview.md` | 10+ | 🔴 Critical |
| `ADR-001` (spec-first) | Repository-wide | 🔴 Critical |
| `ADR-002` (event-driven) | 8+ | 🟠 High |
| `docs/standards/security.md` | 8+ | 🟠 High |
| `ADR-003` (MCP) | 5+ | 🟡 Medium |
| `docs/release/release-process.md` | 5+ | 🟡 Medium |
| Business overviews | 1–2 each | 🟢 Low |

Changes to 🔴 Critical artifacts must follow the Class 5 (Breaking) change process even for seemingly minor modifications, due to the high number of dependents.

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md)
- [QUALITY_GATES.md](QUALITY_GATES.md)
