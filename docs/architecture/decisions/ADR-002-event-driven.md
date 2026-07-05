# ADR-002: Event-Driven Core Platform

**Status:** Accepted
**Date:** 2026-07-05
**Deciders:** LifeOS Enterprise founding team

---

## Context

LifeOS Enterprise needs to support AI agents, automation workflows, and multiple read models (dashboards, search indexes, knowledge graph) all reacting to state changes. A traditional request/response CRUD architecture struggles to meet these requirements without tight coupling between components.

## Decision

The core platform uses an **event-driven architecture** with Event Sourcing and CQRS:

- All state mutations emit domain events to an append-only event store
- Read models are projections derived from events
- Agents and automation workflows subscribe to events as triggers
- The knowledge graph is updated as a projection of entity-related events

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| CRUD + polling | Simple to implement | High latency, N+1 polling, tight coupling |
| CRUD + webhooks | Simpler than events | Delivery guarantees hard; no replay |
| Event Sourcing + CQRS | Replay, auditability, decoupling | Higher initial complexity |
| Message queue only (no event sourcing) | Simpler than full ES | No historical replay; audit harder |

## Consequences

**Positive:**
- Complete audit log of all changes
- Agents can subscribe to any domain event
- Automation workflows are first-class citizens
- Time-travel debugging and historical queries enabled
- Easy to add new projections without modifying the write path

**Negative:**
- Eventual consistency must be communicated to users
- Implementation complexity higher than simple CRUD
- Event schema evolution requires careful versioning

## Mitigations

- Define event schema versioning strategy in [Engineering Standards](../../standards/engineering.md)
- Use optimistic UI patterns to hide eventual consistency from users
- Define consistency guarantees per domain in API specifications
