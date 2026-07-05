# API Overview

## Purpose

This section contains the full API specification for LifeOS Enterprise, including authentication flows, resource endpoints, and integration guidelines.

---

## Base URL

```
Production:  https://api.lifeos.app/api/v1
Staging:     https://api.staging.lifeos.app/api/v1
Local:       http://localhost:3000/api/v1
```

---

## API Principles

All API design follows the [API Standards](../standards/api.md). Key points:

- REST over HTTPS
- JSON request and response bodies
- All endpoints return the standard [response envelope](../schemas/api-schemas.md)
- Versioning via URL prefix (`/api/v1/`)
- Cursor-based pagination
- Prefixed ULID identifiers

---

## Endpoint Index

### Authentication (`/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create a new operator account |
| POST | `/auth/verify-email` | Verify email address with token |
| POST | `/auth/login` | Authenticate and receive tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate all tokens |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Complete password reset |

### Users (`/users`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update current user profile |
| DELETE | `/users/me` | Delete account (initiates 30-day grace period) |

### Business Units (`/business-units`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-units` | List all business units for the current user |
| POST | `/business-units` | Create a business unit |
| GET | `/business-units/:id` | Get business unit details |
| PATCH | `/business-units/:id` | Update business unit |
| DELETE | `/business-units/:id` | Archive business unit |

### Projects (`/projects`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-units/:buId/projects` | List projects in a business unit |
| POST | `/business-units/:buId/projects` | Create a project |
| GET | `/projects/:id` | Get project details |
| PATCH | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Archive project |
| GET | `/projects/:id/tasks` | List tasks in a project |
| GET | `/projects/:id/contacts` | List contacts linked to a project |
| GET | `/projects/:id/notes` | List notes linked to a project |

### Tasks (`/tasks`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks/inbox` | Get current user's task inbox (all projects) |
| POST | `/projects/:projectId/tasks` | Create a task |
| GET | `/tasks/:id` | Get task details |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Archive task |
| POST | `/tasks/:id/complete` | Mark task as complete |
| POST | `/tasks/:id/reopen` | Reopen a completed task |

### Contacts (`/contacts`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-units/:buId/contacts` | List contacts |
| POST | `/business-units/:buId/contacts` | Create a contact |
| GET | `/contacts/:id` | Get contact details |
| PATCH | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Archive contact |
| POST | `/contacts/:id/link-project` | Link contact to a project |
| DELETE | `/contacts/:id/link-project/:projectId` | Unlink contact from project |

### Notes (`/notes`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-units/:buId/notes` | List notes |
| POST | `/business-units/:buId/notes` | Create a note |
| GET | `/notes/:id` | Get note details |
| PATCH | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Archive note |

### Agents (`/agents`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-units/:buId/agents` | List agents |
| GET | `/agents/:id` | Get agent details |
| PATCH | `/agents/:id` | Update agent configuration |
| POST | `/agents/:id/enable` | Enable agent |
| POST | `/agents/:id/disable` | Disable agent |
| GET | `/agents/:id/actions` | List agent action history |
| POST | `/agents/:id/actions/:actionId/approve` | Approve pending action |
| POST | `/agents/:id/actions/:actionId/reject` | Reject pending action |
| POST | `/agents/:id/actions/:actionId/undo` | Undo executed action (within 30 min) |

### Automations (`/automations`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-units/:buId/automations` | List automations |
| POST | `/business-units/:buId/automations` | Create an automation |
| GET | `/automations/:id` | Get automation details |
| PATCH | `/automations/:id` | Update automation |
| DELETE | `/automations/:id` | Delete automation |
| POST | `/automations/:id/enable` | Enable automation |
| POST | `/automations/:id/disable` | Disable automation |
| POST | `/automations/:id/test` | Test run automation (dry run) |
| GET | `/automations/:id/runs` | List execution history |

### Search (`/search`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/search` | Search across all entity types |

---

## Rate Limits

See [API Standards — Rate Limiting](../standards/api.md#10-rate-limiting).

---

## Webhooks

Webhooks are available for all domain events. Configuration:
- `POST /business-units/:buId/webhooks` — register a webhook endpoint
- Events are delivered as POST requests with the [event envelope](../schemas/event-schemas.md)
- Delivery includes `X-LifeOS-Signature` HMAC header for verification
- Failed deliveries are retried with exponential backoff (max 72 hours)

---

## Related Documents

- [Authentication Details](authentication.md)
- [Request/Response Schemas](../schemas/api-schemas.md)
- [Error Codes](../schemas/api-schemas.md#error-codes)
- [API Standards](../standards/api.md)
