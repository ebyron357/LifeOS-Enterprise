# API Standards

## Overview

All LifeOS Enterprise APIs follow these conventions. Deviations require explicit justification in the implementing repository's documentation.

---

## 1. Protocol & Format

- Protocol: HTTPS only
- Format: JSON (request and response bodies)
- Character encoding: UTF-8
- Base URL structure: `https://{host}/api/v{N}/{resource}`
- API versioning: URL path versioning (`/api/v1/`, `/api/v2/`)

---

## 2. Resource Naming

- Resource names are **plural nouns**: `/tasks`, `/projects`, `/contacts`
- Nested resources use path hierarchy: `/projects/{id}/tasks`
- Nesting depth ≤ 2 levels (avoid `/a/{id}/b/{id}/c/{id}`)
- kebab-case for multi-word resource names: `/business-units`
- Query parameter names use camelCase: `?dueAfter=2026-01-01`

---

## 3. HTTP Methods

| Action | Method | Notes |
|--------|--------|-------|
| List resources | GET | Supports pagination and filtering |
| Get single resource | GET | Returns 404 if not found |
| Create resource | POST | Returns 201 with created resource |
| Full update | PUT | Replaces entire resource |
| Partial update | PATCH | Updates specified fields only |
| Delete resource | DELETE | Returns 204 on success |

---

## 4. Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate name) |
| 422 | Unprocessable Entity (semantic validation failure) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 5. Response Envelope

All API responses use a consistent envelope.

**Success (single resource):**
```json
{
  "data": { ... },
  "meta": { "requestId": "req_01J..." }
}
```

**Success (list):**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 143,
    "hasNextPage": true,
    "nextCursor": "cur_..."
  },
  "meta": { "requestId": "req_01J..." }
}
```

**Error:**
```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "The requested task does not exist.",
    "details": { "taskId": "task_01J..." }
  },
  "meta": { "requestId": "req_01J..." }
}
```

---

## 6. Pagination

- Default page size: 20
- Maximum page size: 100
- Pagination uses cursor-based pagination for lists (not offset)
- Cursor parameter: `?cursor={cursor_token}`
- Page size parameter: `?perPage=50`

---

## 7. Filtering & Sorting

- Filter parameters use the field name: `?status=active&priority=high`
- Date range filters: `?createdAfter=2026-01-01&createdBefore=2026-12-31`
- Sort parameter: `?sortBy=dueDate&sortOrder=asc`
- Sort order values: `asc` | `desc` (default: `desc`)

---

## 8. IDs

- All entity IDs use the format: `{type_prefix}_{ulid}` — e.g., `task_01J...`, `proj_01J...`
- ULIDs (Universally Unique Lexicographically Sortable Identifiers) used for all entity IDs
- IDs are opaque strings — clients must not parse or construct them

### ID Prefixes

| Entity | Prefix | Example |
|--------|--------|---------|
| User | `usr_` | `usr_01J...` |
| Business Unit | `bu_` | `bu_01J...` |
| Project | `proj_` | `proj_01J...` |
| Task | `task_` | `task_01J...` |
| Contact | `ctc_` | `ctc_01J...` |
| Note | `note_` | `note_01J...` |
| Agent | `agent_` | `agent_01J...` |
| Agent Action | `aa_` | `aa_01J...` |
| Event | `evt_` | `evt_01J...` |
| Automation | `auto_` | `auto_01J...` |

---

## 9. Authentication

- All authenticated endpoints require: `Authorization: ******
- Public endpoints (login, registration, health check) do not require the header
- Token expiry returns `401 Unauthorized` with error code `TOKEN_EXPIRED`
- Missing token returns `401 Unauthorized` with error code `TOKEN_MISSING`

---

## 10. Rate Limiting

- Rate limits returned in headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Default limits per authenticated user:
  - 1,000 requests / 15 minutes for read endpoints
  - 200 requests / 15 minutes for write endpoints
  - 10 requests / minute for agent invocation endpoints
- 429 response includes `Retry-After` header

---

## 11. Timestamps

- All timestamps in ISO 8601 format: `2026-07-05T08:00:00.000Z`
- All timestamps in UTC
- Timestamp fields: `createdAt`, `updatedAt`, `deletedAt` (soft delete)

---

## 12. OpenAPI Documentation

- All endpoints documented in OpenAPI 3.1 format
- Schema files maintained in [docs/api/](.)
- Documentation auto-generated from code annotations where possible
- Documentation verified in CI (schema drift test)

---

## 13. Deprecation Policy

- Deprecated endpoints annotated with `Deprecated: true` in OpenAPI and `X-Deprecated: true` response header
- Minimum 6-month deprecation window before removal
- Deprecation announced via changelog and email (SaaS phase)
