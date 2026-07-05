# LifeOS Core Implementation Monorepo

This repository contains executable software for LifeOS Core.

## Canonical Specification

The canonical product and architecture specification lives in the LifeOS Enterprise specification repository. This implementation references that source of truth and does not redefine PRDs/ADRs/standards.

Key references:

- `docs/architecture/overview.md`
- `docs/architecture/decisions/ADR-001-spec-first.md`
- `docs/standards/engineering.md`
- `docs/standards/security.md`
- `docs/standards/testing.md`

## Quick Start

```bash
pnpm install
pnpm dev
```

## Monorepo

- `apps/web` — Next.js App Router web shell
- `apps/api` — API runtime shell
- `packages/core` — platform core infrastructure modules
- `packages/database` — database and cache clients
- `packages/api` — tRPC router package
- `packages/shared-types` — shared contracts
- `packages/shared-config` — validated runtime configuration
- `packages/shared-ui` — reusable UI components
- `services/worker` — background service scaffold

## Quality & Security

- Strict TypeScript, ESLint, Prettier
- Husky + lint-staged + Changesets
- Vitest + Playwright with coverage thresholds
- GitHub Actions CI, CodeQL, secret scanning
- Dependabot and Renovate
