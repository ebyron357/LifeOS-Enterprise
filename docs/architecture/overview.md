# Architecture Overview

## Purpose

This document describes the high-level architecture of LifeOS Enterprise — the conceptual layers, system boundaries, and how the pieces relate to each other.

---

## Architectural Style

LifeOS Enterprise is designed as a **modular, event-driven platform** with a clear separation between:

1. **The Specification Layer** (this repository) — defines what the system is
2. **The Core Platform Layer** — business logic, data storage, and APIs
3. **The Integration Layer** — MCP servers, third-party connectors, webhooks
4. **The Intelligence Layer** — AI agents, knowledge graph, reasoning engines
5. **The Presentation Layer** — web UI, mobile apps, CLI tooling

---

## System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                      LifeOS Enterprise Platform                  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   TradeIQ    │  │ Alternative  │  │    ClientVerse        │   │
│  │   Module     │  │   Module     │  │      Module           │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│  ┌──────▼─────────────────▼──────────────────────▼───────────┐  │
│  │                    Core Platform                           │  │
│  │  Projects │ Tasks │ Knowledge │ Contacts │ Finance         │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │               Intelligence & Automation Layer             │   │
│  │    AI Agents │ Knowledge Graph │ Workflow Engine          │   │
│  └───────────────────────────┬──────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │                   Integration Layer                       │   │
│  │   MCP Servers │ Webhooks │ External APIs │ Sync          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
    Web / Mobile           CLI / API           External Services
```

---

## Core Domains

### Projects & Tasks
- Every business initiative is a project
- Every project has a defined next action at all times
- Tasks have owners, due dates, priorities, and status
- Projects belong to a business and optionally a client

### Knowledge Management
- Structured notes, documents, and decisions
- Tagged and linked via a knowledge graph
- Searchable, summarizable, and agent-accessible
- Version-controlled alongside this specification

### Contact & Relationship Management
- People, companies, and relationships across all business units
- Activity tracking, communication history, deal pipeline

### Finance & Reporting
- Income, expenses, invoices, and forecasts per business unit
- Consolidated view across all entities

### AI Agents
- Named, scoped agents that perform defined tasks
- Operate on real data with human-in-the-loop checkpoints
- See [Agent Framework](../../agents/README.md) for details

### Automation
- Event-triggered workflows
- Scheduled jobs
- Cross-system orchestration
- See [Automation](../../automation/README.md) for definitions

---

## Key Architectural Decisions

All architecture decisions are recorded as ADRs. See [decisions/](decisions/).

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](decisions/ADR-001-spec-first.md) | Specification-First Development | Accepted |
| [ADR-002](decisions/ADR-002-event-driven.md) | Event-Driven Core Platform | Accepted |
| [ADR-003](decisions/ADR-003-mcp-agents.md) | MCP as Agent Integration Standard | Accepted |

---

## Data Architecture

- All entities are uniquely identified with UUIDs
- All mutations produce events (append-only event log)
- Read models are derived from events (CQRS pattern)
- The knowledge graph is the connective tissue across all domains
- See [schemas/](../schemas/) for data shape definitions

---

## Security Architecture

- Authentication: JWT + refresh tokens (implementation-defined)
- Authorization: Role-Based Access Control (RBAC) per business unit
- All AI agent actions are logged and auditable
- Secrets never stored in this specification repository
- See [Security Requirements](../standards/security.md)

---

## Related Documents

- [System Context](system-context.md)
- [Data Flow](data-flow.md)
- [Technology Radar](tech-radar.md)
- [Architecture Decision Records](decisions/)
