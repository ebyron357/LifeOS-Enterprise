# Security Requirements

## Scope

These requirements apply to all LifeOS Enterprise implementation repositories and deployments. Compliance is mandatory before any production deployment.

---

## 1. Authentication

| Requirement | Standard |
|-------------|---------|
| Password hashing | bcrypt, cost factor ≥ 12 |
| Minimum password length | 12 characters |
| Password complexity | At least 1 uppercase, 1 number, 1 symbol |
| Access token lifetime | 15 minutes (JWT) |
| Refresh token lifetime | 30 days; rotated on each use |
| Token storage (client) | `httpOnly` cookies or secure in-memory — never localStorage |
| Multi-factor authentication | Optional in Phase 1; required for admin roles in Phase 5 |
| Session invalidation | Server-side token blacklist; logout invalidates all tokens |

---

## 2. Authorization

- Role-Based Access Control (RBAC) enforced at the API layer
- Roles are scoped to business units — permissions do not cross business unit boundaries
- Authorization checks happen server-side on every request — client-side checks are UI only
- Agents are authorized as principals with explicit, minimal scopes
- Principle of least privilege: every user/agent/service has only the permissions it needs

### Default Roles

| Role | Scope | Capabilities |
|------|-------|-------------|
| `operator` | Platform | Full access to all their business units |
| `bu_admin` | Business Unit | Manage users, settings, and all data within the BU |
| `member` | Business Unit | Read/write assigned projects and tasks |
| `viewer` | Business Unit | Read-only access |
| `agent:{agent_id}` | Defined scope | Only the tools and data in the agent's MCP server config |

---

## 3. Data Protection

- All data encrypted at rest (AES-256 minimum)
- All data encrypted in transit (TLS 1.2+ required; TLS 1.3 preferred)
- Database backups encrypted with a separate key
- PII (email addresses, names, phone numbers) treated as sensitive and never logged in plaintext
- Data retention policy: operator data retained 90 days after account cancellation, then purged

---

## 4. Input Validation

- All user input validated server-side before processing (never trust client-side validation alone)
- SQL queries use parameterized statements only — no string concatenation
- All text content sanitized before rendering to prevent XSS
- File upload types restricted to explicit allowlist; files scanned before storage
- API request size limits enforced (request body ≤ 10MB by default)

---

## 5. OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|-----------|
| A01: Broken Access Control | RBAC enforced on every endpoint; automated tests verify authorization |
| A02: Cryptographic Failures | TLS everywhere; AES-256 at rest; no MD5/SHA1 for security functions |
| A03: Injection | Parameterized queries; ORM usage; input validation |
| A04: Insecure Design | Spec-first; threat modeling required for each phase |
| A05: Security Misconfiguration | Infrastructure-as-code with security baselines; no default credentials |
| A06: Vulnerable Components | Automated dependency scanning (Dependabot + `npm audit`) |
| A07: Authentication Failures | See Section 1; rate limiting; account lockout |
| A08: Software Integrity | Signed releases; dependency lockfiles committed |
| A09: Logging Failures | Structured logging; audit log for all mutations; no sensitive data in logs |
| A10: SSRF | Allowlist for outbound HTTP requests; no user-supplied URLs in server-side fetches without validation |

---

## 6. AI Agent Security

- Every agent action is logged with: agent ID, timestamp, input hash, output hash, approval status
- Agents cannot exceed their defined permission scope
- Agent inputs are sanitized to prevent prompt injection attacks
- Agent outputs are validated against expected schema before execution
- High-impact agent actions (create, delete, send) require human approval unless explicitly configured otherwise
- Agent execution environment is isolated — no direct database access (only via MCP API)

---

## 7. Infrastructure Security

- No services exposed to the public internet without authentication
- Admin interfaces protected by VPN or bastion host
- Database ports not publicly accessible
- Secrets stored in secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager)
- Infrastructure changes reviewed via IaC PR process — no console changes in production
- Security groups/firewall rules follow deny-all-by-default with explicit allowlists

---

## 8. Incident Response

| Severity | Definition | Response SLA |
|----------|-----------|-------------|
| P1 Critical | Data breach, auth bypass, data loss | Immediate; all-hands |
| P2 High | Privilege escalation, service outage | < 1 hour |
| P3 Medium | Data exposure (non-sensitive), degraded service | < 4 hours |
| P4 Low | Minor vulnerability, no active exploitation | < 72 hours |

**Disclosure policy:** Security vulnerabilities are reported privately to the security contact before any public disclosure. 90-day coordinated disclosure window.

---

## 9. Compliance

Phase 1–6: Internal compliance only.
Phase 7 (SaaS): The following are required before launch:
- GDPR: Data processing agreements, right to erasure implemented, DPA published
- SOC 2 Type I: Target within 12 months of SaaS launch
- Penetration test: Required before Phase 7 launch and annually thereafter

---

## 10. Security Review Checklist

Before any production deployment:
- [ ] OWASP ZAP scan passed with no high/critical findings
- [ ] `npm audit` / `pip audit` clean
- [ ] All secrets in secrets manager (no secrets in code or env files committed)
- [ ] TLS configuration verified (Grade A on SSL Labs)
- [ ] Authentication flows manually tested (happy path + all error cases)
- [ ] Authorization tested: verify cross-user, cross-BU data isolation
- [ ] Agent permission scopes reviewed and documented
