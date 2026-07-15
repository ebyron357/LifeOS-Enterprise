# Business Engine

The Business Engine is the primary object model of LifeOS Enterprise. Every other module — Projects, Knowledge, AI Agents, Finance, CRM, Automations — connects to a Business.

---

## Architecture

```
packages/api/src/
├── trpc.ts                          # tRPC factory, auth context, procedure builders
├── routers/
│   ├── business.router.ts           # 20 tRPC endpoints
│   └── index.ts                     # appRouter
└── services/business/
    ├── types.ts                     # Domain types (DB-level records, I/O types)
    ├── business.repository.ts       # IBusinessRepository + InMemoryBusinessRepository
    ├── business.service.ts          # Main orchestrator
    ├── business-health.engine.ts    # 6-dimension health scoring
    ├── kpi.service.ts               # KPI trend / format / progress computation
    └── relationship.engine.ts       # 13-type entity relationship management
```

The Business Engine follows a layered architecture:

```
tRPC Router (authorization + input validation)
     ↓
BusinessService (orchestration + audit + activity + versioning)
     ↓
IBusinessRepository (data access contract)
     ↓
InMemoryBusinessRepository (test/dev) | DrizzleBusinessRepository (production)
```

---

## Business Identity

Every business has two stable identifiers:

| Field | Format | Purpose |
|---|---|---|
| `id` | UUID v4 | Internal DB primary key |
| `business_key` | `BIZ-XXXX` | Stable human-readable reference |

All API endpoints accept either format via the `id` parameter. The service resolves both through `getByKey(idOrKey, orgId)`.

Slug generation is automatic from the business name (URL-safe, lowercase, hyphenated). Duplicate names receive an auto-incremented suffix (`-1`, `-2`) rather than rejecting the creation.

---

## Multi-Tenancy

Every record is scoped to an `org_id`. The repository never returns records across org boundaries. The tRPC context supplies `ctx.org_id` for every authenticated request.

---

## Business Status

| Status | Meaning |
|---|---|
| `Pre-Launch` | Idea or early planning stage |
| `Active` | Operating normally |
| `Scaling` | Actively growing |
| `Mature` | Stable, established |
| `Paused` | Temporarily suspended |
| `Closed` | No longer operating |

---

## CRUD Operations

### Create
```ts
businessRouter.create.mutate({
  name: 'TradeIQ',
  status: 'Active',
  tags: ['fintech', 'saas'],
  metadata: { tier: 'premium' },
})
```

Required: `name`, `status`. Optional: `model`, `industry`, `founded`, `website`, `github_org`, `description`, `tags`, `metadata`.

### Read
```ts
// By UUID or BIZ-XXXX key
businessRouter.get.query({ id: 'BIZ-TRIQ01' })
businessRouter.get.query({ id: 'uuid-here' })

// Paginated list
businessRouter.list.query({
  page: 1,
  per_page: 25,
  sort_field: 'updated',
  sort_order: 'desc',
  filter: { status: ['Active', 'Scaling'], tags: ['saas'] },
})

// Full-text search
businessRouter.search.query({ query: 'trade', limit: 20 })
```

### Update
```ts
businessRouter.update.mutate({
  id: 'BIZ-TRIQ01',
  data: { status: 'Scaling', website: 'https://tradeiq.io' },
})
```

Every update increments `version` and saves a snapshot to version history.

### Archive / Restore
```ts
businessRouter.archive.mutate({ id: 'BIZ-TRIQ01', reason: 'Pivoting focus' })
businessRouter.restore.mutate({ id: 'BIZ-TRIQ01' })
```

Archived businesses are hidden from standard list/search queries unless `filter.archived: true` is passed.

---

## KPI Framework

KPIs are attached to a business and tracked over time.

### Direction Types

| Direction | Meaning |
|---|---|
| `higher_is_better` | Revenue, users, NPS |
| `lower_is_better` | Churn rate, error rate, support tickets |
| `target_range` | Metric should stay near a target value |

### Status Computation

KPI status is computed automatically on create/update:

- `on_track` — within 10% of target
- `at_risk` — within 25% of target, or at warning threshold
- `off_track` — beyond 25% from target, or at critical threshold
- `not_set` — no `current_value` recorded

### Trend Computation

`KPIService.computeTrend(kpi)` returns:
- `direction`: `'up' | 'down' | 'stable'`
- `is_positive`: `true` if the change is beneficial
- `percent_change`: relative change from previous value

---

## Health Framework

`BusinessHealthEngine.compute(inputs)` produces a `BusinessHealthScore` with:

| Field | Type | Description |
|---|---|---|
| `overall_score` | 0–100 | Weighted composite score |
| `label` | `Excellent\|Good\|Fair\|Poor\|Critical` | Human-readable label |
| `dimensions` | `HealthScoreDimension[]` | Per-dimension breakdown |
| `recommendations` | `string[]` | Actionable improvement suggestions |
| `requires_attention` | `boolean` | True when score < 60 |

### Dimensions and Weights

| Dimension | Weight | Signal Source |
|---|---|---|
| `kpi_performance` | 30% | KPI on_track / at_risk / off_track counts |
| `project_health` | 25% | Active, stale, blocked, overdue projects |
| `agent_activity` | 20% | AI agent tasks, error rate, escalations |
| `automation_reliability` | 15% | Automation success rate, consecutive failures |
| `knowledge_coverage` | 5% | Linked knowledge objects, review queue |
| `repository_health` | 5% | Repository commit recency, health status |

---

## Relationship Engine

Businesses connect to 13 entity types:

| Type | Example |
|---|---|
| `project` | `PRJ-XXXX` |
| `knowledge` | Knowledge base articles |
| `agent` | `AGT-XXXX` AI agents |
| `automation` | `AUT-XXXX` workflows |
| `person` | Team members and collaborators |
| `repository` | GitHub repositories |
| `meeting` | Meeting records |
| `document` | Business documents |
| `finance_account` | Finance accounts |
| `crm_contact` | CRM contacts |
| `dashboard` | Analytics dashboards |
| `sop` | Standard operating procedures |
| `workflow` | Business workflows |

```ts
businessRouter.linkEntity.mutate({
  id: 'BIZ-TRIQ01',
  entity_type: 'project',
  entity_key: 'PRJ-ALPHA01',
})
```

`getRelationships` returns a flat `RelationshipSummary[]`. Each entry contains `entity_type`, `entity_key`, `relationship_label`, and `metadata`.

---

## Audit & Activity

Every write operation produces both an audit log entry and an activity timeline event.

### Audit Log
- Immutable append-only record
- Stores `before_state`, `after_state`, `change_diff`
- Keyed by `entity_id = business_key` (BIZ-XXXX)
- Admin-only access via `getAuditHistory`

### Activity Timeline
- Human-readable event stream
- Includes actor name, event type, and description
- Used for business feeds and recent activity displays
- Viewer access via `getActivity`

---

## Version History

A full snapshot is saved on every write (create, update, archive, restore).

```ts
businessRouter.getVersionHistory.query({ id: 'BIZ-TRIQ01', limit: 10 })
// Returns BusinessVersionRecord[] sorted newest-first

businessRouter.getVersionAt.query({ id: 'BIZ-TRIQ01', version: 3 })
// Returns specific historical snapshot
```

---

## Authorization

| Operation | Required Role |
|---|---|
| list, get, search, getHealth, getActivity, getVersionHistory, getRelationships, listKPIs | `viewer` |
| create, update, addTag, removeTag, createKPI, updateKPI, deleteKPI, linkEntity, unlinkEntity | `member` |
| archive, restore, getAuditHistory | `admin` |

Role hierarchy: `viewer < member < admin < owner`.

---

## Repository Pattern

`IBusinessRepository` defines the full production contract. The `InMemoryBusinessRepository` implements it with synchronous in-memory Maps — used for all tests and development without requiring a database.

The production `DrizzleBusinessRepository` (using `@lifeos/db` schema) is the intended next-phase implementation.

---

## Testing

```bash
# Run all tests
cd packages/api && npx vitest run

# Run with coverage
cd packages/api && npx vitest run --coverage
```

Test files:

| File | Tests | Coverage Area |
|---|---|---|
| `business.repository.test.ts` | 46 | Full CRUD, pagination, KPIs, relationships, audit, activity, versioning |
| `business.service.test.ts` | 34 | Service orchestration, slug/key generation, tags, health |
| `business.router.test.ts` | 20 | All endpoints + RBAC enforcement |
| `business-health.engine.test.ts` | 10 | Health scoring, dimension computation, recommendations |
| `kpi.service.test.ts` | 20 | Trend, format, progress computation |
| `business.schema.test.ts` | 34 | Zod schema validation |

**Total: 164 tests, 0 failures.**
