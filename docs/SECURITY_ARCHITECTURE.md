# LifeOS — Security Architecture

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect / Security Advisor  
> **Last Updated:** 2026-07-04

---

## Overview

Security is not a feature added to LifeOS — it is a design constraint applied from the first line of code. LifeOS handles sensitive business data, financial information, strategic decisions, and AI agent credentials. A breach is not an inconvenience; it is a business-destroying event.

This document defines the complete security architecture: authentication, authorization, RBAC, secrets management, encryption, audit logging, backup strategy, recovery procedures, and threat model.

---

## Authentication

### Mechanism
LifeOS uses **JWT-based authentication** with short-lived access tokens and long-lived refresh tokens. The auth layer is built on Clerk (or NextAuth.js) with Supabase Auth as the backing identity store.

### Authentication Methods
| Method | Use Case | Notes |
|--------|---------|-------|
| Email + password | Default | Bcrypt hashing; min 12 characters |
| Google OAuth | Primary social login | OAuth 2.0 PKCE flow |
| GitHub OAuth | Developer users | OAuth 2.0 PKCE flow |
| Magic link (email) | Passwordless option | 15-minute expiry |
| SSO / SAML | Enterprise plan | Okta, Azure AD, Google Workspace |
| API key | Machine access | Long-lived; scoped; revocable |

### Token Security
| Token | Expiry | Storage | Transmission |
|-------|--------|---------|-------------|
| Access token | 15 minutes | Memory only (never localStorage) | Authorization header |
| Refresh token | 30 days | httpOnly cookie (Secure, SameSite=Strict) | Cookie |
| API key | Until revoked | Hashed in DB (SHA-256); shown once | X-API-Key header |

### Session Rules
- Concurrent sessions allowed (tracked by device)
- Session revocation propagates within 15 minutes (access token expiry)
- Suspicious login attempts trigger email notification
- Failed login lockout: 5 attempts → 15-minute lockout

---

## Authorization

### Role-Based Access Control (RBAC)

See full permission matrix in [API_SPECIFICATION.md](./API_SPECIFICATION.md).

#### Enforcement Layers
1. **API layer** — tRPC middleware checks role on every procedure
2. **Database layer** — Supabase RLS policies enforce org isolation
3. **UI layer** — Components conditionally render based on permission (defense-in-depth; never the primary control)

#### Principle of Least Privilege
- Every role starts with no permissions; only what is explicitly granted is allowed
- Agents have their own `agent` role scoped to their defined capabilities
- API keys are scoped to specific procedures at creation time

### Resource-Level Authorization
Beyond RBAC roles, resource-level checks verify:
- The requested resource belongs to the user's organization
- The user has the specific role required for the action
- Agent tasks can only be approved by users with sufficient role (≥ `member`)

---

## Secrets Management

### Principle
**No secrets in source code. No secrets in environment files committed to git. No exceptions.**

### Storage Tiers
| Secret Type | Storage | Access |
|------------|---------|--------|
| Database credentials | Vercel Environment Variables (encrypted) | Server runtime only |
| AI model API keys | Vercel Environment Variables + Supabase Vault | Server runtime only |
| MCP connector tokens | Supabase Vault (encrypted at rest) | Server runtime only |
| Webhook signing secrets | Vercel Environment Variables | Webhook handler only |
| JWT signing key | Vercel Environment Variables (RS256 private key) | Auth service only |
| Stripe keys | Vercel Environment Variables | Billing service only |

### Secret Rotation
| Secret | Rotation Frequency | Trigger |
|--------|------------------|---------|
| JWT signing key | Every 90 days | Scheduled or on suspected compromise |
| Database password | Every 180 days | Scheduled |
| AI API keys | On team member departure | Event-driven |
| MCP connector tokens | Per connector renewal schedule | Event-driven |
| Webhook secrets | On suspected compromise | Event-driven |

### .gitignore Rules
```
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

The Security Advisor agent is configured to scan every PR for secrets before merge.

---

## Encryption

### In Transit
- All traffic over **TLS 1.3** minimum
- HSTS header enforced: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- No HTTP connections accepted; all redirected to HTTPS
- TLS certificates managed by Vercel (auto-renewed)

### At Rest
| Data | Encryption |
|------|-----------|
| Database (PostgreSQL) | AES-256 (Supabase managed) |
| File storage | AES-256 (Supabase Storage / S3 managed) |
| Redis cache | AES-256 (Upstash managed) |
| Backups | AES-256 (provider managed) |
| MCP secrets in Vault | AES-256 (Supabase Vault) |

### Sensitive Field Encryption
The following database fields are additionally encrypted at the application layer (before storage) using AES-256-GCM with a per-tenant key:
- `agent.system_prompt` (may contain business context)
- `settings.value` (may contain integration credentials)
- `approval_requests.details` (may contain sensitive business data)

---

## Input Security

### Validation
- All inputs validated via Zod schemas before reaching business logic
- No raw SQL queries — all database access through Drizzle ORM (parameterized)
- HTML content in rich-text fields sanitized with DOMPurify before storage

### Output Encoding
- All user-generated content HTML-escaped before rendering in the UI
- JSON responses never include executable content
- Content-Security-Policy header enforced on all pages

### API Security
- Rate limiting on all endpoints (see [API_SPECIFICATION.md](./API_SPECIFICATION.md))
- CORS configured to allow only the LifeOS domain
- CSRF protection via SameSite cookies + custom header verification
- Request size limits: 1 MB for JSON, 50 MB for file uploads

---

## Audit Logging

### What Is Logged
Every state-changing operation is logged to the `audit_log` table:

| Event Category | Examples |
|---------------|---------|
| Authentication | login, logout, failed_login, password_change, token_revoke |
| Entity mutations | create, update, archive, delete for all entities |
| Decision lifecycle | decision.propose, decision.finalize, decision.reverse |
| Agent actions | task.dispatch, task.approve, task.reject |
| Permission changes | role.assign, role.revoke, member.invite, member.remove |
| Integration events | mcp.connect, mcp.disconnect, api_key.create, api_key.revoke |
| Security events | suspicious_login, rate_limit_exceeded, unauthorized_access |

### Audit Log Immutability
- The `audit_log` table has no UPDATE or DELETE permissions, even for the application user
- Supabase RLS enforces append-only: `CREATE POLICY "audit_insert_only" ON audit_log FOR INSERT WITH CHECK (true)`
- Audit logs are exported to cold storage daily and immutable there

### Audit Log Retention
| Data | Retention |
|------|----------|
| Audit log (database) | 2 years |
| Audit log (cold storage export) | 7 years |
| Agent task logs | 1 year |
| Authentication logs | 2 years |

---

## Threat Model

Based on the STRIDE methodology:

### S — Spoofing
**Threat:** Attacker impersonates a user or agent  
**Controls:** JWT with short expiry, refresh token rotation, httpOnly cookies, suspicious login detection

### T — Tampering
**Threat:** Attacker modifies in-flight API requests  
**Controls:** TLS 1.3, HMAC-signed webhook payloads, Zod input validation, parameterized queries

### R — Repudiation
**Threat:** User denies performing an action  
**Controls:** Immutable audit log with user ID, IP, and timestamp on every action

### I — Information Disclosure
**Threat:** Unauthorized access to another org's data  
**Controls:** Supabase RLS, JWT org_id claim, application-layer org scoping on every query

### D — Denial of Service
**Threat:** Flooding the API with requests  
**Controls:** Rate limiting (Redis token bucket), Vercel DDoS protection, request size limits

### E — Elevation of Privilege
**Threat:** Attacker gains higher permissions than authorized  
**Controls:** Least-privilege RBAC, role checks in API middleware, no client-side role trust

---

## Backup Strategy

| Asset | Backup Method | Frequency | Retention |
|-------|-------------|-----------|----------|
| PostgreSQL | Supabase continuous WAL + daily snapshots | Continuous + daily | 30 days rolling |
| File storage | S3 cross-region replication | Real-time | 30 days |
| Audit log | Daily export to cold storage (S3 Glacier) | Daily | 7 years |
| Configuration | Infrastructure as code in git | Every commit | Permanent |
| AI model configs | Git (agent config files) | Every commit | Permanent |

---

## Recovery Procedures

### RTO and RPO Targets
| Scenario | RTO (Recovery Time) | RPO (Recovery Point) |
|---------|--------------------|--------------------|
| Database corruption | < 1 hour | < 5 minutes (WAL) |
| Complete database loss | < 4 hours | < 24 hours (daily snapshot) |
| Storage loss | < 2 hours | Near-zero (real-time replication) |
| Full platform loss | < 8 hours | < 24 hours |

### Recovery Runbook (Summary)
1. Detect via monitoring alert (Checkly / Sentry)
2. Triage: scope and severity assessment
3. Isolate: prevent further data loss
4. Communicate: notify affected users if applicable
5. Restore: initiate recovery from backup
6. Verify: confirm data integrity post-restore
7. Post-mortem: document root cause and prevention

Full runbook: `/sops/incident-response.md`

---

## Dependency Security

- All third-party dependencies audited with `npm audit` on every PR
- Dependabot enabled for automated security patch PRs
- No dependencies with known Critical or High CVEs may be merged
- `package-lock.json` locked and verified in CI
- Security Advisor agent reviews all new dependency additions

---

## Future Security Enhancements

| Enhancement | Phase | Notes |
|-------------|-------|-------|
| SOC 2 Type II | Phase 7 | Requires formal audit program |
| GDPR data deletion | Phase 5 | Right-to-erasure implementation |
| Multi-factor authentication (TOTP) | Phase 2 | Required for enterprise plan |
| Penetration testing | Phase 4 | Quarterly external pentest |
| Bug bounty program | Phase 6 | After marketplace launch |
| Data residency (EU, US) | Phase 7 | Multi-region deployment |
