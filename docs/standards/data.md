# Data Standards

## Purpose

These standards govern how data is defined, stored, and exchanged across all LifeOS Enterprise implementation repositories.

---

## 1. Data Modeling Principles

1. **Entities over tables** — model the business concept first; choose storage structure second
2. **Immutable events** — mutations produce events; read models are projections
3. **Soft deletes** — entities are never hard-deleted; they are archived with `deletedAt` timestamp
4. **Audit fields on all entities** — `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`
5. **No null IDs in foreign keys** — use optional relationships explicitly; distinguish "not set" from "unknown"

---

## 2. Required Audit Fields

Every entity in the data model must include:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string (ULID prefixed)` | Unique identifier |
| `createdAt` | `timestamp (UTC)` | When the entity was created |
| `updatedAt` | `timestamp (UTC)` | When the entity was last modified |
| `deletedAt` | `timestamp (UTC) \| null` | When the entity was soft-deleted; null = active |
| `createdBy` | `UserId \| AgentId` | Who created the entity |
| `updatedBy` | `UserId \| AgentId` | Who last updated the entity |

---

## 3. Business Unit Scoping

Every entity (except `User` and `BusinessUnit` themselves) must carry a `businessUnitId` field. All queries must filter by `businessUnitId` before returning results. This is enforced at the API layer and must be enforced at the database layer via row-level security or query filters.

---

## 4. Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Entity names | PascalCase singular | `Task`, `BusinessUnit` |
| Field names | camelCase | `dueDate`, `businessUnitId` |
| Database column names | snake_case | `due_date`, `business_unit_id` |
| Enum values | SCREAMING_SNAKE_CASE | `IN_PROGRESS`, `ON_HOLD` |
| Event names | `{Entity}{PastTenseVerb}` | `TaskCreated`, `ProjectStatusUpdated` |

---

## 5. Enumeration Values

Enumerations must be defined in the canonical schemas before use in any implementation. See [schemas/core-entities.md](../schemas/core-entities.md).

New enum values may be added but existing values may never be removed or renamed (they may be deprecated). Removing an enum value is a breaking change requiring a new API version.

---

## 6. Event Schema

All domain events follow this structure:

```
{
  "eventId": "evt_01J...",
  "eventType": "TaskCreated",
  "entityId": "task_01J...",
  "entityType": "Task",
  "businessUnitId": "bu_01J...",
  "occurredAt": "2026-07-05T08:00:00.000Z",
  "actorId": "usr_01J...",       // or "agent:agent_01J..."
  "payload": { ... },             // event-specific data
  "schemaVersion": "1.0"
}
```

See [schemas/event-schemas.md](../schemas/event-schemas.md) for all event definitions.

---

## 7. Schema Versioning

- Schemas are versioned using semantic versioning (`major.minor`)
- Backward-compatible additions (new optional fields): increment minor version
- Breaking changes (rename, remove, change type): increment major version and require API version bump
- All events carry `schemaVersion` to allow consumers to handle version transitions

---

## 8. Data Export

All user data must be exportable in a standard open format:
- Entities: JSON or CSV
- Attachments: original files
- Events: append-only JSON log

Export must be available on demand at any time, including after account cancellation (within the 90-day retention window).

---

## 9. Sensitive Data Fields

The following field categories are treated as sensitive and subject to additional controls:

| Category | Fields | Controls |
|----------|--------|---------|
| Authentication | `passwordHash`, `refreshToken` | Never exposed via API; not in logs |
| PII | `email`, `phone`, `fullName` | Not logged in plaintext; masked in non-prod |
| Integration tokens | `accessToken`, `clientSecret` | Encrypted at rest; never in API responses |
| Financial | `invoiceAmount`, `accountNumber` | Access-controlled; summarized in logs |

---

## 10. Migrations

- All schema migrations are version-controlled
- Migrations are run forward-only in production (no rollback scripts required, but must be safe to re-run)
- Every migration must have a description explaining the business reason for the change
- Large migrations (affecting > 1M rows) require an offline migration plan
