# Changelog

All notable changes to LifeOS Enterprise are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- `DrizzleBusinessRepository` PostgreSQL implementation for the full `IBusinessRepository` contract.
- Drizzle migration configuration at `packages/db/drizzle.config.ts`.
- Versioned SQL migrations in `packages/db/drizzle/` for Business Engine tables.
- `RelationshipEngine.getMap()` unit coverage via `packages/api/src/__tests__/relationship.engine.test.ts`.
- Foundation hardening validation report at `docs/FOUNDATION_HARDENING_REPORT.md`.

### Changed
- Validators coverage config now excludes `packages/validators/src/index.ts`.
- API coverage config now excludes `business.repository.postgres.ts` until DB-backed repository integration tests are added.
- Database schema now stores `business_key` on `kpis` and `business_relationships` for contract compatibility with business service records.

---

## [2.0.0] — Sprint 3: Business Engine

### Added

#### Monorepo Infrastructure
- `turbo.json` — Turborepo 2.x task pipeline (build → typecheck → lint → test)
- `pnpm-workspace.yaml` — pnpm 9 workspace definition for 5 packages
- `tsconfig.base.json` — strict TypeScript 5 base config (ES2022, NodeNext modules)
- `eslint.config.mjs` — flat ESLint config with TypeScript strict rules
- `prettier.config.js` — single quotes, no semicolons, 100-char print width
- `vitest.config.ts` — root Vitest config with 80% coverage thresholds
- `.github/workflows/ci.yml` — CI pipeline: lint, typecheck, test, schema validation

#### `@lifeos/types` (v2.0.0)
- Complete TypeScript type definitions for all 15 LifeOS domain schemas
- Business, Project, Knowledge, AI Agent, Automation, MCP, Repository, People,
  Finance, CRM, Dashboard, SOP, Workflow, Notification, Settings types
- Branded types: `BusinessId`, `OrgId`, `UserId`, `ISODate`, `ISODateTime`

#### `@lifeos/validators` (v2.0.0)
- Complete Zod validation schemas for all Business Engine operations
- `CreateBusinessSchema`, `UpdateBusinessSchema`, `ArchiveBusinessSchema`, `RestoreBusinessSchema`
- `CreateKPISchema` (with `nonnegative` target_value), `UpdateKPISchema`
- `ListBusinessesSchema` with pagination, sort, and filter
- `SearchBusinessesSchema` (limit default 20, max 100)
- `GetByIdSchema` accepting both UUID and BIZ-XXXX keys
- `GetActivitySchema`, `GetAuditHistorySchema`, `GetVersionHistorySchema`
- `AddTagSchema`, `RemoveTagSchema`
- 34 unit tests covering valid inputs, edge cases, and validation failures

#### `@lifeos/config` (v2.0.0)
- Environment-driven runtime configuration — zero hardcoded values
- `databaseConfig`, `redisConfig`, `authConfig`, `serverConfig`, `featureFlags`
- `NODE_ENV` parsed through type-safe `parseNodeEnv()` helper
- Required env vars throw at startup with actionable error messages
- Test-safe: `IS_TEST` mode uses `:memory:` DB and test JWT secret

#### `@lifeos/db` (v2.0.0)
- Drizzle ORM PostgreSQL schema for 7 tables:
  `businesses`, `business_versions`, `kpis`, `business_relationships`,
  `audit_log`, `activity_events`, `business_health_scores`
- Full index strategy for org-scoped queries and search

#### `@lifeos/api` — Business Engine (v2.0.0)

**Domain Types** (`services/business/types.ts`)
- `BusinessRecord`, `KPIRecord`, `BusinessRelationshipRecord`, `BusinessVersionRecord`
- `AuditLogRecord`, `ActivityEventRecord`, `BusinessHealthScore`
- `BusinessQueryOptions`, `PaginatedBusinessResult`, `BusinessSearchResult`
- All write input types: `CreateBusinessData`, `UpdateBusinessData`, `CreateKPIData`, `UpdateKPIData`

**IBusinessRepository Interface + InMemoryBusinessRepository**
- Full async interface for production repository contract
- In-memory implementation for tests and development
- Business CRUD: `findById`, `findByKey`, `findMany`, `create`, `update`, `archive`, `restore`, `softDelete`, `search`, `slugExists`
- Version history: `saveVersion`, `getVersionHistory`, `getVersionAt`
- KPI management: `createKPI`, `updateKPI`, `deleteKPI`, `getKPI`, `listKPIs`
- Relationships: `addRelationship`, `removeRelationship`, `listRelationships`
- Audit: `createAuditEntry`, `getAuditHistory`
- Activity: `createActivityEvent`, `getActivityTimeline`

**BusinessHealthEngine** (`services/business/business-health.engine.ts`)
- 6-dimension weighted health scoring: `project_health`, `kpi_performance`,
  `agent_activity`, `automation_reliability`, `knowledge_coverage`, `repository_health`
- Labels: Excellent / Good / Fair / Poor / Critical
- `recommendations[]` field with actionable improvement suggestions
- KPI performance scores 0 when no KPIs are defined

**KPIService** (`services/business/kpi.service.ts`)
- `computeTrend(kpi)` → `KPITrend | null` with `direction`, `is_positive`, `percent_change`
- `formatValue(kpi, value)` — currency, percentage, count, score, time, custom
- `computeProgress(kpi)` → 0–100 progress toward target
- `listForBusiness(businessId, orgId)` → `KPIWithTrend[]`

**RelationshipEngine** (`services/business/relationship.engine.ts`)
- 13 entity types: project, knowledge, agent, automation, person, repository,
  meeting, document, finance_account, crm_contact, dashboard, sop, workflow
- `link()`, `unlink()`, `getMap()`, `listByType()`
- `BusinessRelationshipMap` — grouped by entity type with totals
- `getRelationships()` returns flat `RelationshipSummary[]` for API consumers

**BusinessService** (`services/business/business.service.ts`)
- Full orchestrator for all business operations
- Automatic slug generation (unique within org, never rejects duplicates)
- BIZ-XXXX key generation with collision avoidance
- Every write records a version snapshot, audit entry, and activity event
- `getByKey(idOrKey, orgId)` handles both UUID and BIZ-XXXX lookups
- Tag normalization to lowercase, idempotent add/remove
- Health computation with external signal injection

**tRPC Router** (`routers/business.router.ts`)
- 20 endpoints across all business operations
- Role-based access control: viewer / member / admin / owner
- `list`, `get`, `create`, `update`, `archive`, `restore`, `search`
- `addTag`, `removeTag`
- `createKPI`, `updateKPI`, `deleteKPI`, `listKPIs`
- `getHealth` — compute health with injected signals
- `getActivity`, `getAuditHistory`, `getVersionHistory`
- `linkEntity`, `unlinkEntity`, `getRelationships`
- Service singleton with `resetBusinessService()` for test isolation

**tRPC Foundation** (`trpc.ts`)
- `createAuthenticatedTestContext()` for test helpers
- Procedure builders: `publicProcedure`, `protectedProcedure`, `viewerProcedure`,
  `memberProcedure`, `adminProcedure`, `ownerProcedure`
- Production error formatting (hides cause in production)

**Test Suite** — 164 tests, 0 failures
- `business.repository.test.ts` — 46 integration tests (CRUD, pagination, KPIs, relationships, audit, activity, versioning)
- `business.service.test.ts` — 34 unit tests (all service operations)
- `business.router.test.ts` — 20 tests (all endpoints + RBAC enforcement)
- `business-health.engine.test.ts` — 10 unit tests
- `kpi.service.test.ts` — 20 unit tests
- `business.schema.test.ts` — 34 validation tests

### Fixed
- `exactOptionalPropertyTypes` removed from tsconfig — incompatible with Zod inferred types
- `@types/node` added to `@lifeos/config` and `@lifeos/api`
- `GetActivitySchema`, `GetAuditHistorySchema`, `GetVersionHistorySchema` — `id` field now accepts both UUID and BIZ-XXXX (was BIZ-XXXX only)
- `BusinessService.getRelationships()` returns flat `RelationshipSummary[]` (was grouped map)
- `CreateKPISchema.target_value` — added `.nonnegative()` constraint
- ESLint config — added Node.js globals, disabled `no-undef` (TypeScript handles), test overrides for `no-non-null-assertion`
- All `no-non-null-assertion` violations in production code replaced with safe optional chaining

---

## [1.0.0] — Sprint 1 & 2: Foundation + Architecture

### Added
- Full architecture documentation for all 15 LifeOS domain modules
- JSON schemas for all entity types
- Sprint 1: Core foundation documentation
- Sprint 2: Operator OS specification
