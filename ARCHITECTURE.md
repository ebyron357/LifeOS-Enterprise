# LifeOS Core Architecture

## Purpose

This repository implements the LifeOS runtime platform. Canonical requirements, ADRs, PRDs, and standards are defined in the LifeOS Enterprise specification repository and referenced here.

## Traceability to Specification

- Architecture overview: `docs/architecture/overview.md`
- Spec-first governance: `docs/architecture/decisions/ADR-001-spec-first.md`
- Event-driven decision: `docs/architecture/decisions/ADR-002-event-driven.md`
- API standards: `docs/standards/api.md`
- Security standards: `docs/standards/security.md`
- Testing standards: `docs/standards/testing.md`

## Monorepo Layout

- `apps/` — deployable applications (`web`, `api`)
- `packages/` — reusable platform libraries (`core`, `api`, `database`, shared packages)
- `services/` — background workers
- `database/` — migration and data-layer assets
- `infra/` — docker and deployment scaffolding
- `scripts/` — bootstrap and automation scripts
- `tests/` — unit and e2e tests

## Core Infrastructure Modules

- Authentication foundation and secure headers in Next.js app layer
- Runtime configuration with strict environment validation (`zod`)
- Structured logging (`pino`) with sensitive-value redaction
- Unified error model (`AppError`)
- Validation layer wrapper
- Dependency injection container (`tsyringe`)
- Database clients (`drizzle`, `pg`, `supabase`, `redis`)
- Repository base abstraction
- In-process event bus
- Health checks and observability span utilities
