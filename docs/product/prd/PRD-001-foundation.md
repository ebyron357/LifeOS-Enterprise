# PRD-001: Foundation

**Status:** Draft
**Phase:** 1
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

The Foundation phase delivers the minimum viable operating system: authentication, business units, projects, tasks, and contacts. This phase establishes the core data model and API that all subsequent phases build upon.

---

## Goals

1. Operator can authenticate and manage their identity
2. Multiple business units can be created and isolated
3. Projects can be created, organized, and tracked
4. Every project always has a defined "next action"
5. Contacts can be created and linked to projects
6. All data is accessible via a documented REST API

---

## Non-Goals

- No AI agents in this phase
- No integrations with external tools
- No automation workflows
- No mobile application (web only)
- No multi-user/team features (single operator per business unit)

---

## User Stories

See [user-stories/foundation-stories.md](../user-stories/foundation-stories.md) for detailed stories.

### Epic 1: Authentication & Identity
- As an operator, I can create an account with email and password
- As an operator, I can log in and receive a session token
- As an operator, I can log out from all sessions
- As an operator, I can reset my password via email

### Epic 2: Business Units
- As an operator, I can create a business unit with a name and type
- As an operator, I can switch between business units
- As an operator, I can archive a business unit
- As an operator, each business unit's data is isolated from others

### Epic 3: Projects
- As an operator, I can create a project within a business unit
- As an operator, I can define a project's goal and current next action
- As an operator, I can set a project's status (Active, On Hold, Complete, Cancelled)
- As an operator, I can view all projects for a business unit in a list and board view
- As an operator, I am warned if any project has no defined next action

### Epic 4: Tasks
- As an operator, I can create a task within a project
- As an operator, I can assign a task a due date, priority, and status
- As an operator, I can view all my tasks across projects in a single inbox
- As an operator, I can mark a task complete and the project's next action updates

### Epic 5: Contacts
- As an operator, I can create a contact (person or company)
- As an operator, I can link a contact to one or more projects
- As an operator, I can view a contact's linked projects and recent activity

---

## Acceptance Criteria

### AC-001: Authentication
- [ ] Registration requires email + password (min 12 chars, 1 uppercase, 1 number, 1 symbol)
- [ ] Passwords are hashed with bcrypt (cost factor ≥ 12) — never stored in plaintext
- [ ] JWT access tokens expire in 15 minutes; refresh tokens in 30 days
- [ ] Failed login attempts are rate-limited (5 attempts / 15 minutes per IP)
- [ ] Password reset tokens are single-use and expire in 1 hour

### AC-002: Business Units
- [ ] Business unit names are unique per operator
- [ ] Data queries for one business unit never return data from another
- [ ] Archived business units are excluded from default views but accessible via filter

### AC-003: Projects
- [ ] A project without a next action displays a visual warning in all list views
- [ ] Project status changes are timestamped and stored
- [ ] Projects cannot be permanently deleted — only archived

### AC-004: Tasks
- [ ] Task inbox displays tasks sorted by: overdue (red) → due today → upcoming
- [ ] Completing the last open task in a project prompts the operator to define the next action
- [ ] Tasks support subtasks (one level deep only)

### AC-005: API
- [ ] All endpoints documented in OpenAPI 3.1 format
- [ ] All endpoints return appropriate HTTP status codes
- [ ] All 4xx responses include a machine-readable error code and human message
- [ ] API response time P95 ≤ 200ms for read operations under normal load

---

## Data Model

See [schemas/core-entities.md](../../schemas/core-entities.md) for full entity definitions.

Key entities in this phase:
- `User`
- `BusinessUnit`
- `Project`
- `Task`
- `Contact`

---

## Performance Requirements

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Page load (initial) | < 1s | < 2s | < 3s |
| API read (single entity) | < 50ms | < 200ms | < 500ms |
| API write (create/update) | < 100ms | < 300ms | < 1s |
| Task inbox render (100 tasks) | < 200ms | < 500ms | < 1s |

---

## Security Requirements

See [Security Standards](../../standards/security.md) for full requirements. Phase 1 mandates:
- HTTPS everywhere (no HTTP in production)
- All user input validated and sanitized server-side
- OWASP Top 10 mitigated before launch
- Dependency audit clean before first deployment

---

## Open Questions

1. Should operators be able to invite team members in Phase 1, or defer to Phase 2?
2. Should contacts support custom fields in Phase 1 or Phase 2?
3. What is the maximum number of business units per operator in Phase 1?
