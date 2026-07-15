# LifeOS — API Specification

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect  
> **Last Updated:** 2026-07-04

---

## Overview

The LifeOS API is a **tRPC API** — fully type-safe, end-to-end, with TypeScript types shared between the server and client. For external consumers (mobile apps, third-party integrations, CLI tools), a **REST API** is generated from the same routers using `trpc-openapi`.

This document defines the API contract, conventions, authentication, authorization, validation, pagination, search, versioning, and error handling.

---

## API Architecture

```
Client (Next.js / Mobile / CLI)
    │
    │  tRPC (internal) / REST (external)
    ▼
API Layer (Next.js API Routes)
    │
    ├── /api/trpc/[...trpc]   → tRPC handler (all internal calls)
    └── /api/v1/[...rest]     → REST handler (trpc-openapi)
```

Internal callers (the LifeOS web app) always use tRPC. External callers use the REST API under `/api/v1/`.

---

## Naming Standards

### tRPC Procedure Naming

```
router.entity.action

Examples:
  business.create
  business.update
  business.archive
  project.list
  project.getPriorities
  knowledge.search
  agent.dispatch
  decision.finalize
```

### REST Endpoint Naming (OpenAPI)

```
Method  Path                             Action
GET     /api/v1/businesses               List businesses
POST    /api/v1/businesses               Create business
GET     /api/v1/businesses/:id           Get business
PATCH   /api/v1/businesses/:id           Update business
DELETE  /api/v1/businesses/:id           Archive business (soft delete)
GET     /api/v1/businesses/:id/projects  List projects for business
GET     /api/v1/businesses/:id/health    Get business health score

GET     /api/v1/projects                 List all projects
POST    /api/v1/projects                 Create project
GET     /api/v1/projects/:id             Get project
PATCH   /api/v1/projects/:id             Update project
GET     /api/v1/projects/:id/blockers    Get project blockers
GET     /api/v1/projects/:id/priority    Get priority score

GET     /api/v1/knowledge                List knowledge objects
POST    /api/v1/knowledge                Create knowledge object
GET     /api/v1/knowledge/:id            Get knowledge object
PATCH   /api/v1/knowledge/:id            Update knowledge object
GET     /api/v1/knowledge/search         Search knowledge

GET     /api/v1/decisions                List decisions
POST    /api/v1/decisions                Create decision
GET     /api/v1/decisions/:id            Get decision
PATCH   /api/v1/decisions/:id/finalize   Finalize decision
PATCH   /api/v1/decisions/:id/reverse    Reverse decision

GET     /api/v1/agents                   List agents
POST    /api/v1/agents/:id/dispatch      Dispatch task to agent
GET     /api/v1/agents/:id/tasks         Get agent task history
GET     /api/v1/tasks/:id                Get task status

GET     /api/v1/search                   Universal search

GET     /api/v1/health                   System health scores
```

---

## Authentication

### Mechanism
All API requests require a valid **JWT ****** issued by the authentication service.

```
Authorization: ******
```

### Token Structure
```json
{
  "sub": "user_uuid",
  "org_id": "org_uuid",
  "role": "admin",
  "iat": 1720000000,
  "exp": 1720086400
}
```

### Token Lifecycle
| Token | Expiry | Refresh |
|-------|--------|---------|
| Access token | 15 minutes | Via refresh token |
| Refresh token | 30 days | Via `/api/v1/auth/refresh` |
| API key (machine) | Never (until revoked) | Manual rotation |

### Machine Authentication
Automation systems and external integrations use long-lived API keys:
```
X-API-Key: lifeos_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are scoped to an organization and a set of allowed procedures.

---

## Authorization

### RBAC Roles

| Role | Capabilities |
|------|-------------|
| `owner` | All operations including billing and org deletion |
| `admin` | All operations except billing and org deletion |
| `member` | Read/write on assigned entities; cannot delete or archive |
| `viewer` | Read-only on all entities |
| `agent` | Programmatic access scoped to agent capabilities |

### Permission Matrix

| Operation | owner | admin | member | viewer |
|-----------|-------|-------|--------|--------|
| Read any entity | ✅ | ✅ | ✅ | ✅ |
| Create entity | ✅ | ✅ | ✅ | ❌ |
| Update entity | ✅ | ✅ | ✅ (own) | ❌ |
| Archive/delete entity | ✅ | ✅ | ❌ | ❌ |
| Finalize decision | ✅ | ✅ | ❌ | ❌ |
| Approve agent task | ✅ | ✅ | ✅ (own) | ❌ |
| Manage integrations | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Access audit log | ✅ | ✅ | ❌ | ❌ |

### Data Isolation
Authorization is enforced at two layers:
1. **Application layer:** tRPC middleware checks `org_id` from JWT and injects into all queries
2. **Database layer:** Supabase RLS policies enforce org isolation even if application layer is bypassed

---

## Validation

All inputs are validated using **Zod schemas** defined in `packages/validators/`. The same Zod schemas are used:
- Server-side (tRPC input validation)
- Client-side (form validation)
- OpenAPI spec generation

Example:
```typescript
const createProjectSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().min(3).max(150),
  summary: z.string().max(1000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  ownerId: z.string().uuid().optional(),
  reviewDate: z.string().date().optional(),
  githubRepo: z.string().url().optional(),
})
```

### Validation Rules
- All UUIDs validated as `z.string().uuid()`
- All dates validated as ISO 8601 strings
- Enums use `z.enum()` matching database constraints
- Optional fields use `.optional()` not `.nullable()` unless the database allows NULL

---

## Pagination

All list endpoints support cursor-based pagination:

### Request Parameters
```
GET /api/v1/projects?cursor=<cursor>&limit=25
```

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `cursor` | string (opaque) | — | — |
| `limit` | integer | 25 | 100 |

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6InV1aWQiLCJjcmVhdGVkX2F0IjoiMjAyNiJ9",
    "hasMore": true,
    "totalCount": 142
  }
}
```

`cursor` is a base64-encoded JSON object containing the last item's sort key. It is opaque to the client — never parsed, only echoed back.

---

## Filtering

All list endpoints support structured filtering via query parameters:

```
GET /api/v1/projects?status=active&priority=critical&businessId=uuid&ownerId=uuid
GET /api/v1/knowledge?domain=technology&status=active&confidenceMin=0.8
GET /api/v1/decisions?status=proposed&impact=high&businessId=uuid
```

### Common Filters

| Parameter | Type | Available on |
|-----------|------|-------------|
| `status` | string (enum) | projects, decisions, automations, agents |
| `priority` | string (enum) | projects, agent_tasks |
| `businessId` | UUID | projects, decisions, knowledge, meetings |
| `ownerId` | UUID | projects, decisions, deliverables |
| `domain` | string | knowledge |
| `updatedAfter` | ISO date | all entities |
| `updatedBefore` | ISO date | all entities |

---

## Search

### Full-Text Search
```
GET /api/v1/search?q=graphql+pagination&type=knowledge,project&limit=20
```

### Response Format
```json
{
  "query": "graphql pagination",
  "results": [
    {
      "rank": 1,
      "type": "knowledge",
      "id": "uuid",
      "title": "GraphQL Pagination Patterns",
      "excerpt": "...cursor-based pagination in GraphQL...",
      "status": "active",
      "relevanceScore": 0.94,
      "relationships": {
        "projects": [{ "id": "uuid", "title": "API v2" }],
        "businesses": [{ "id": "uuid", "name": "ClientVerse" }]
      }
    }
  ],
  "totalCount": 7,
  "facets": {
    "type": { "knowledge": 4, "project": 2, "decision": 1 },
    "status": { "active": 6, "needs_review": 1 }
  }
}
```

### Semantic Search
```
GET /api/v1/search?q=how+to+handle+api+auth&mode=semantic&limit=10
```

Semantic search uses pgvector cosine similarity on OpenAI embeddings.

---

## Versioning

### URL Versioning
REST API: `/api/v1/` → `/api/v2/` when breaking changes are required

### Versioning Policy
| Change Type | Policy |
|-------------|--------|
| New endpoints | Non-breaking — added to current version |
| New optional fields in response | Non-breaking — added to current version |
| New required request fields | Breaking — new version required |
| Removing fields | Breaking — new version required |
| Changing field types | Breaking — new version required |
| Changing status enum values | Breaking — new version required |

### Deprecation Policy
1. Deprecated endpoints are documented in CHANGELOG
2. `Deprecation: <date>` header added to deprecated responses
3. Deprecated endpoints are supported for minimum 6 months
4. `Sunset: <date>` header added when removal date is set

---

## Error Handling

### Error Response Format
All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found",
    "details": {
      "resourceType": "project",
      "resourceId": "uuid"
    },
    "requestId": "req_xxxxxxxxxxx"
  }
}
```

### Error Codes

| HTTP Status | tRPC Code | Use Case |
|------------|-----------|---------|
| 400 | `BAD_REQUEST` | Invalid input, validation failure |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Valid auth but insufficient permission |
| 404 | `NOT_FOUND` | Entity does not exist or not in org |
| 409 | `CONFLICT` | Duplicate resource, state conflict |
| 422 | `UNPROCESSABLE_CONTENT` | Business logic violation |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | Downstream service unavailable |

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Per IP (unauthenticated) | 20 requests | 1 minute |
| Per user (authenticated) | 200 requests | 1 minute |
| Per org (authenticated) | 1,000 requests | 1 minute |
| AI agent dispatch | 10 tasks | 1 minute |
| Search | 60 queries | 1 minute |

Rate limit headers on every response:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 147
X-RateLimit-Reset: 1720000060
```

---

## Standard Response Envelope

All successful responses use a consistent envelope:

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_xxxxxxxxxxx",
    "timestamp": "2026-07-04T09:00:00Z",
    "version": "1.0"
  }
}
```

List responses include pagination:
```json
{
  "data": [...],
  "pagination": { "cursor": "...", "hasMore": true, "totalCount": 47 },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

---

## OpenAPI / Swagger

The REST API exposes an OpenAPI 3.1 specification at:
```
GET /api/v1/openapi.json
```

Interactive documentation at:
```
GET /api/v1/docs
```

The spec is auto-generated from tRPC routers using `trpc-openapi`. It is always in sync with the actual implementation.
