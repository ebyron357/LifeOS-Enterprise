# API Schemas

## Overview

This document defines request and response schemas for the LifeOS Enterprise REST API. These schemas are the source of truth for OpenAPI documentation.

---

## Common Schemas

### PaginationParams (Query)
```
page?:    integer  default=1  min=1
perPage?: integer  default=20 min=1 max=100
cursor?:  string
```

### SortParams (Query)
```
sortBy?:    string  (field name)
sortOrder?: "asc" | "desc"  default="desc"
```

### ListResponse<T>
```json
{
  "data": T[],
  "pagination": {
    "page": integer,
    "perPage": integer,
    "total": integer,
    "hasNextPage": boolean,
    "nextCursor": string | null
  },
  "meta": {
    "requestId": string
  }
}
```

### SingleResponse<T>
```json
{
  "data": T,
  "meta": {
    "requestId": string
  }
}
```

### ErrorResponse
```json
{
  "error": {
    "code": string,
    "message": string,
    "details": object | null
  },
  "meta": {
    "requestId": string
  }
}
```

---

## Authentication

### POST /api/v1/auth/register
**Request:**
```json
{
  "email": "string (email format)",
  "password": "string (min 12 chars)"
}
```
**Response 201:**
```json
{
  "data": {
    "userId": "usr_...",
    "message": "Verification email sent"
  }
}
```

### POST /api/v1/auth/login
**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response 200:**
```json
{
  "data": {
    "accessToken": "string (JWT)",
    "expiresIn": 900,
    "user": User
  }
}
```
Note: `refreshToken` is set as `httpOnly` cookie, not in response body.

### POST /api/v1/auth/refresh
**Request:** No body. Reads `refreshToken` from cookie.
**Response 200:** Same as login response (new access token issued).

### POST /api/v1/auth/logout
**Request:** No body.
**Response 204:** No content. All tokens invalidated.

---

## Projects

### GET /api/v1/business-units/:buId/projects
**Query params:** `status?`, `search?`, pagination, sort
**Response:** `ListResponse<Project>`

### POST /api/v1/business-units/:buId/projects
**Request:**
```json
{
  "name": "string (required, 1-200 chars)",
  "goal": "string?",
  "nextAction": "string?",
  "status": "ProjectStatus? (default: active)",
  "dueDate": "string? (ISO 8601)",
  "tags": "string[]?"
}
```
**Response 201:** `SingleResponse<Project>`

### GET /api/v1/projects/:id
**Response:** `SingleResponse<Project>`

### PATCH /api/v1/projects/:id
**Request:** Partial `Project` (any fields except id, businessUnitId, createdAt, createdBy)
**Response:** `SingleResponse<Project>`

### DELETE /api/v1/projects/:id
**Response 204:** Project soft-deleted.

---

## Tasks

### GET /api/v1/projects/:projectId/tasks
**Query params:** `status?`, `priority?`, `assigneeId?`, `dueAfter?`, `dueBefore?`, pagination, sort
**Response:** `ListResponse<Task>`

### GET /api/v1/tasks/inbox
**Auth scope:** Current user across all projects in BU
**Query params:** `businessUnitId?`, `status?`, `priority?`, pagination
**Response:** `ListResponse<Task>`

### POST /api/v1/projects/:projectId/tasks
**Request:**
```json
{
  "title": "string (required, 1-500 chars)",
  "description": "string?",
  "status": "TaskStatus? (default: open)",
  "priority": "TaskPriority? (default: medium)",
  "dueDate": "string? (ISO 8601)",
  "assigneeId": "string?",
  "parentTaskId": "string?",
  "tags": "string[]?"
}
```
**Response 201:** `SingleResponse<Task>`

### PATCH /api/v1/tasks/:id
**Request:** Partial `Task`
**Response:** `SingleResponse<Task>`

### POST /api/v1/tasks/:id/complete
**Request:** `{}`
**Response:** `SingleResponse<Task>` with `status: "complete"` and `completedAt` set.

---

## Contacts

### GET /api/v1/business-units/:buId/contacts
**Query params:** `type?`, `search?`, pagination, sort
**Response:** `ListResponse<Contact>`

### POST /api/v1/business-units/:buId/contacts
**Request:**
```json
{
  "type": "ContactType (required)",
  "name": "string (required)",
  "email": "string?",
  "phone": "string?",
  "company": "string?",
  "website": "string?",
  "industry": "string?",
  "notes": "string?",
  "tags": "string[]?"
}
```
**Response 201:** `SingleResponse<Contact>`

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TOKEN_MISSING` | 401 | No authorization token provided |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token is malformed or tampered |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required role |
| `RESOURCE_NOT_FOUND` | 404 | Requested entity does not exist |
| `BUSINESS_UNIT_NOT_FOUND` | 404 | Business unit not found |
| `PROJECT_NOT_FOUND` | 404 | Project not found |
| `TASK_NOT_FOUND` | 404 | Task not found |
| `CONTACT_NOT_FOUND` | 404 | Contact not found |
| `VALIDATION_ERROR` | 400 | Input failed validation |
| `DUPLICATE_NAME` | 409 | Entity name already in use |
| `CROSS_BU_ACCESS_DENIED` | 403 | Attempted cross-BU data access |
| `RATE_LIMIT_EXCEEDED` | 429 | Request rate limit hit |
| `AGENT_SCOPE_VIOLATION` | 403 | Agent attempted out-of-scope action |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
