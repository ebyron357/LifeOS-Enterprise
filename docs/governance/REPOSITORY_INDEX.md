# Repository Index

**Document Type:** Reference  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Per release; updated whenever a document is added or deprecated  

---

## Purpose

This is the master index of every document in the `LifeOS-Enterprise` specification repository. It is the authoritative starting point for navigating the repository and understanding the scope and state of all specifications.

Documents are grouped by category. For each document the index records: purpose, owner, key dependencies, last updated date, and related documents.

To add a document to this index, follow the instructions in [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Index Groups

1. [Governance](#governance)
2. [Architecture](#architecture)
3. [Product](#product)
4. [Standards](#standards)
5. [Design System](#design-system)
6. [Schemas](#schemas)
7. [API](#api)
8. [Release](#release)
9. [Businesses](#businesses)
10. [Agents](#agents)
11. [MCP](#mcp)
12. [Automation](#automation)
13. [Templates](#templates)

---

## Governance

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md) | Defines document ownership, approval requirements, review cadence, deprecation policy, breaking change policy, and release documentation requirements | Founding Team | ADR-001 | 2026-07-05 | All governance docs |
| [DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md) | Defines all lifecycle stages (Draft → Active → Deprecated → Archived) and transition rules for every document in the repository | Founding Team | REPOSITORY_GOVERNANCE.md | 2026-07-05 | CHANGE_CONTROL.md, REPOSITORY_INDEX.md |
| [CHANGE_CONTROL.md](CHANGE_CONTROL.md) | Defines the 5-class change control process: classification, PR requirements, reviewer assignment, merge rules, and emergency process | Founding Team | REPOSITORY_GOVERNANCE.md, REVIEW_PROCESS.md | 2026-07-05 | QUALITY_GATES.md, DECISION_PROCESS.md |
| [VERSIONING_POLICY.md](VERSIONING_POLICY.md) | Defines versioning for the repository (spec tags), individual documents (MAJOR.MINOR), schemas, and APIs | Founding Team | docs/release/release-process.md | 2026-07-05 | DOCUMENT_LIFECYCLE.md, docs/schemas/ |
| [REVIEW_PROCESS.md](REVIEW_PROCESS.md) | Defines reviewer roles, review criteria, SLAs, comment resolution, periodic reviews, and terminology consistency | Founding Team | CHANGE_CONTROL.md, QUALITY_GATES.md | 2026-07-05 | DECISION_PROCESS.md, CONTRIBUTING.md |
| [DECISION_PROCESS.md](DECISION_PROCESS.md) | Defines how architectural, product, and governance decisions are made, recorded, and communicated; defines ADR lifecycle and conflict resolution | Founding Team | templates/adr-template.md, REVIEW_PROCESS.md | 2026-07-05 | TRACEABILITY_MATRIX.md, ADR directory |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Cross-reference matrix linking every major artifact to its related ADRs, PRDs, user stories, schemas, APIs, standards, and release milestones | Founding Team | All repository documents | 2026-07-05 | REPOSITORY_INDEX.md, QUALITY_GATES.md |
| [QUALITY_GATES.md](QUALITY_GATES.md) | Defines 12 mandatory quality gates (QG-01 through QG-12) enforced at review time for all documentation changes | Founding Team | CHANGE_CONTROL.md, REVIEW_PROCESS.md | 2026-07-05 | CONTRIBUTING.md, TRACEABILITY_MATRIX.md |
| [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md) | This document. Master index of every document in the repository, grouped by category | Founding Team | All repository documents | 2026-07-05 | TRACEABILITY_MATRIX.md |

---

## Architecture

### Architecture Decision Records

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [ADR-001: Specification-First](../architecture/decisions/ADR-001-spec-first.md) | Establishes this repository as the canonical specification; mandates spec-first process for all implementation | Founding Team | — | 2026-07-05 | All documents |
| [ADR-002: Event-Driven Core Platform](../architecture/decisions/ADR-002-event-driven.md) | Adopts Event Sourcing + CQRS as the core platform architecture for state management, agent triggers, and audit | Founding Team | ADR-001 | 2026-07-05 | docs/schemas/event-schemas.md, PRD-003, PRD-006 |
| [ADR-003: MCP as Agent Integration Standard](../architecture/decisions/ADR-003-mcp-agents.md) | Mandates Model Context Protocol (MCP) as the standard for all agent tool integration | Founding Team | ADR-001, ADR-002 | 2026-07-05 | PRD-003, PRD-004, mcp/README.md |
| [ADR README](../architecture/decisions/README.md) | Index and guidance for the ADR directory | Founding Team | ADR-001 | 2026-07-05 | All ADRs |

### Architecture Documents

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Architecture Overview](../architecture/overview.md) | High-level system architecture narrative covering all layers and their relationships | Lead Architect | ADR-001, ADR-002, ADR-003 | 2026-07-05 | system-context.md, data-flow.md, tech-radar.md |
| [System Context](../architecture/system-context.md) | System context diagram showing LifeOS Enterprise and its external actors and integrations | Lead Architect | ADR-001, ADR-002 | 2026-07-05 | architecture/overview.md |
| [Data Flow](../architecture/data-flow.md) | Data flow diagrams showing how data moves through the event-driven platform | Lead Architect | ADR-002 | 2026-07-05 | docs/schemas/event-schemas.md, PRD-001, PRD-006 |
| [Technology Radar](../architecture/tech-radar.md) | Current technology choices, adopt/trial/assess/hold categorizations | Lead Architect | ADR-001, ADR-002, ADR-003 | 2026-07-05 | All ADRs |

---

## Product

### Vision & Strategy

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Product Vision](../product/vision.md) | Mission, problem statement, target users, value propositions, success metrics, and long-term vision | Product Owner | — | 2026-07-05 | docs/product/roadmap.md |
| [Product Roadmap](../product/roadmap.md) | Seven-phase roadmap with goals, exit criteria, and PRD links for each phase | Product Owner | All PRDs | 2026-07-05 | docs/product/vision.md, All PRDs |

### Product Requirements Documents

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [PRD-001: Foundation](../product/prd/PRD-001-foundation.md) | Requirements for Phase 1: auth, business units, projects, tasks, contacts, core API | Product Owner | ADR-001, core-entities.md | 2026-07-05 | foundation-stories.md, v1.0-plan.md |
| [PRD-002: Knowledge Graph](../product/prd/PRD-002-knowledge-graph.md) | Requirements for Phase 2: notes, decisions, entity linking, semantic search | Product Owner | ADR-001, ADR-002, core-entities.md | 2026-07-05 | epics.md (E-201–E-204) |
| [PRD-003: AI Agents](../product/prd/PRD-003-ai-agents.md) | Requirements for Phase 3: agent framework, morning brief, task creator, audit & control | Product Owner | ADR-001, ADR-002, ADR-003, core-entities.md | 2026-07-05 | epics.md (E-301–E-304), agents/README.md |
| [PRD-004: MCP Integrations](../product/prd/PRD-004-mcp-integrations.md) | Requirements for Phase 4: calendar, Slack, email, GitHub, finance integrations via MCP | Product Owner | ADR-001, ADR-003 | 2026-07-05 | epics.md (E-401–E-405), mcp/README.md |
| [PRD-005: Business Modules](../product/prd/PRD-005-business-modules.md) | Requirements for Phase 5: TradeIQ, Alternative, and ClientVerse domain-specific modules | Product Owner | ADR-001, core-entities.md, businesses/ | 2026-07-05 | epics.md (E-501–E-503), businesses/ |
| [PRD-006: Automation](../product/prd/PRD-006-automation.md) | Requirements for Phase 6: event-driven workflow engine, automation templates, custom builder | Product Owner | ADR-001, ADR-002, core-entities.md | 2026-07-05 | epics.md (E-601–E-603), automation/README.md |
| [PRD-007: SaaS Platform](../product/prd/PRD-007-saas-platform.md) | Requirements for Phase 7: multi-tenancy, billing, self-serve onboarding, marketplace | Product Owner | ADR-001, PRD-001–PRD-006 | 2026-07-05 | epics.md (E-701–E-704) |

### User Stories

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Epics](../product/user-stories/epics.md) | Master list of all epics across all phases, mapped to PRDs | Product Owner | All PRDs | 2026-07-05 | foundation-stories.md |
| [Foundation Stories](../product/user-stories/foundation-stories.md) | Detailed user stories and acceptance criteria for Phase 1 (E-101–E-105) | Product Owner | PRD-001, core-entities.md | 2026-07-05 | PRD-001, epics.md |

---

## Standards

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Engineering Standards](../standards/engineering.md) | Spec-first process, language choices, code style, git/branching, PR requirements, testing, API design, error handling, secrets, dependencies, performance, logging, documentation | Lead Architect | ADR-001, ADR-002 | 2026-07-05 | All implementation repos |
| [Security Requirements](../standards/security.md) | Authentication, authorization, data protection, OWASP compliance, dependency management, secrets handling | Lead Architect | ADR-001 | 2026-07-05 | PRD-001 (AC-001), docs/api/authentication.md |
| [API Standards](../standards/api.md) | REST conventions, naming, versioning, pagination, error format, IDs (prefixed ULIDs), OpenAPI requirements | Lead Architect | ADR-001 | 2026-07-05 | docs/api/, docs/schemas/api-schemas.md |
| [Data Standards](../standards/data.md) | Data modeling conventions, schema evolution, event naming, retention policies | Lead Architect | ADR-001, ADR-002 | 2026-07-05 | docs/schemas/ |
| [Testing Standards](../standards/testing.md) | Coverage targets, test levels (unit/integration/E2E/agent), tooling, test file conventions | Lead Architect | ADR-001 | 2026-07-05 | docs/standards/engineering.md |

---

## Design System

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Foundations](../design-system/foundations.md) | Visual language foundations: grid, spacing, typography, color system | Design Lead | PRD-001 | 2026-07-05 | tokens.md, components.md |
| [Design Tokens](../design-system/tokens.md) | Canonical design tokens for color, spacing, typography, shadow, border radius | Design Lead | foundations.md | 2026-07-05 | foundations.md, components.md |
| [Components](../design-system/components.md) | Component specifications: structure, props, states, accessibility requirements | Design Lead | tokens.md, foundations.md | 2026-07-05 | tokens.md, foundations.md |

---

## Schemas

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Core Entities](../schemas/core-entities.md) | Canonical TypeScript type definitions for all core entities: User, BusinessUnit, Project, Task, Contact, Note, Decision, Agent, AgentAction, Automation | Lead Architect | ADR-001, ADR-002 | 2026-07-05 | All PRDs, docs/api/ |
| [Event Schemas](../schemas/event-schemas.md) | Domain event schemas for the event-driven platform; event naming conventions and payload structures | Lead Architect | ADR-002 | 2026-07-05 | core-entities.md, PRD-002, PRD-003, PRD-006 |
| [API Schemas](../schemas/api-schemas.md) | API request/response schemas including the canonical error schema | Lead Architect | ADR-001 | 2026-07-05 | docs/api/, core-entities.md |

---

## API

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [API Overview](../api/overview.md) | API design principles, base URLs, versioning, request/response conventions, error format, pagination | Lead Architect | ADR-001, docs/standards/api.md | 2026-07-05 | authentication.md, api-schemas.md |
| [Authentication API](../api/authentication.md) | Authentication endpoints: registration, login, refresh, logout, password reset; token lifecycle | Lead Architect | PRD-001, core-entities.md (User), security standards | 2026-07-05 | docs/api/overview.md, docs/standards/security.md |

---

## Release

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Release Process](../release/release-process.md) | End-to-end release pipeline from spec change to production; release types, changelog, approval gates, rollback policy | Release Manager | ADR-001 | 2026-07-05 | v1.0-plan.md, engineering standards |
| [v1.0 Release Plan](../release/v1.0-plan.md) | Scope, milestones, definition of done, performance targets, and security targets for the Phase 1 production release | Release Manager | PRD-001, core-entities.md, api-schemas.md | 2026-07-05 | release-process.md, PRD-001 |

---

## Businesses

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Businesses README](../../businesses/README.md) | Overview of the three business units managed under LifeOS Enterprise | Product Owner | PRD-005 | 2026-07-05 | TradeIQ overview, Alternative overview, ClientVerse overview |
| [TradeIQ Overview](../../businesses/TradeIQ/overview.md) | Context, goals, and domain requirements for the TradeIQ trading intelligence business unit | TradeIQ Business Owner | PRD-005, core-entities.md | 2026-07-05 | PRD-005, businesses/README.md |
| [Alternative Overview](../../businesses/Alternative/overview.md) | Context, goals, and domain requirements for the Alternative investment management business unit | Alternative Business Owner | PRD-005, core-entities.md | 2026-07-05 | PRD-005, businesses/README.md |
| [ClientVerse Overview](../../businesses/ClientVerse/overview.md) | Context, goals, and domain requirements for the ClientVerse client delivery business unit | ClientVerse Business Owner | PRD-005, core-entities.md | 2026-07-05 | PRD-005, businesses/README.md |

---

## Agents

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Agents README](../../agents/README.md) | AI agent framework overview: agent catalog, capability model, MCP server access, confidence and approval model | AI Lead | ADR-002, ADR-003, PRD-003 | 2026-07-05 | core-entities.md (Agent, AgentAction), mcp/README.md |

---

## MCP

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [MCP README](../../mcp/README.md) | MCP integration catalog: available MCP servers, integration patterns, capability boundaries | AI Lead | ADR-003, PRD-004 | 2026-07-05 | agents/README.md, core-entities.md (Agent) |

---

## Automation

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Automation README](../../automation/README.md) | Automation pattern library: trigger types, action types, condition expressions, pre-built templates | Lead Architect | ADR-002, PRD-006 | 2026-07-05 | core-entities.md (Automation), workflows/README.md |
| [Workflows README](../../workflows/README.md) | Workflow definitions: named workflow specifications using the automation engine | Lead Architect | ADR-002, PRD-006 | 2026-07-05 | automation/README.md, core-entities.md (Automation) |

---

## Templates

| Document | Purpose | Owner | Key Dependencies | Last Updated | Related Documents |
|----------|---------|-------|-----------------|-------------|------------------|
| [Templates README](../../templates/README.md) | Index and guidance for using the template library | Lead Architect | All templates | 2026-07-05 | All templates |
| [ADR Template](../../templates/adr-template.md) | Reusable template for authoring Architecture Decision Records | Lead Architect | DECISION_PROCESS.md | 2026-07-05 | docs/architecture/decisions/ |
| [PRD Template](../../templates/prd-template.md) | Reusable template for authoring Product Requirements Documents | Product Owner | QUALITY_GATES.md | 2026-07-05 | docs/product/prd/ |
| [User Story Template](../../templates/user-story-template.md) | Reusable template for authoring user stories and acceptance criteria | Product Owner | QUALITY_GATES.md (QG-08) | 2026-07-05 | docs/product/user-stories/ |

---

## Document Count Summary

| Group | Count |
|-------|-------|
| Governance | 9 |
| Architecture (ADRs) | 4 |
| Architecture (Documents) | 4 |
| Product (Vision & Strategy) | 2 |
| Product (PRDs) | 7 |
| Product (User Stories) | 2 |
| Standards | 5 |
| Design System | 3 |
| Schemas | 3 |
| API | 2 |
| Release | 2 |
| Businesses | 4 |
| Agents | 1 |
| MCP | 1 |
| Automation | 2 |
| Templates | 4 |
| **Total** | **55** |

---

## Related Documents

- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
