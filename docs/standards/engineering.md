# Engineering Standards

## Purpose

These standards apply to all implementation repositories that build LifeOS Enterprise. Any deviation requires an ADR.

---

## 1. Specification-First Process

1. All new features begin with a spec change in this repository
2. Implementation begins only after the spec PR is merged
3. Implementation repositories reference the spec by commit SHA in their PR descriptions
4. Breaking changes to public APIs require a spec update before implementation

---

## 2. Languages

| Layer | Language | Rationale |
|-------|----------|-----------|
| API / Backend | TypeScript | Type safety, ecosystem |
| AI / Data pipelines | Python | ML ecosystem |
| Infrastructure | YAML / HCL | Kubernetes, Terraform |
| Scripts | Bash (simple) or TypeScript (complex) | Consistency |

No languages other than these may be introduced without an ADR.

---

## 3. Code Style

- **TypeScript:** Strict mode required (`"strict": true` in tsconfig). No `any` without justification comment.
- **Python:** PEP 8 + type hints on all public functions. Black formatter.
- **Line length:** 100 characters maximum.
- **Imports:** Sorted and grouped (stdlib → third-party → internal).
- Linting must pass with zero warnings before merge.

---

## 4. Git & Branching

- **Default branch:** `main` — always deployable
- **Branch naming:** `{type}/{short-description}` where type is: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- **Commit messages:** Conventional Commits format: `type(scope): description`
  - Example: `feat(tasks): add subtask support`
  - Example: `fix(auth): handle expired refresh token correctly`
- No force-pushes to `main`
- Squash-merge PRs to `main` (clean history)

---

## 5. Pull Request Requirements

Every PR must include:
- [ ] Description of what changed and why
- [ ] Reference to the spec commit/section being implemented
- [ ] Tests covering the new behavior
- [ ] No new linting warnings
- [ ] No new security vulnerabilities (run `npm audit` / `pip audit`)
- [ ] Migration plan if a breaking change is included

PR size: aim for < 400 lines of diff. Large PRs must be justified.

---

## 6. Testing Standards

| Level | Coverage Target | Tooling |
|-------|----------------|---------|
| Unit tests | ≥ 80% line coverage | Vitest (TS), pytest (Python) |
| Integration tests | All API endpoints | Supertest / httpx |
| End-to-end tests | Critical user journeys | Playwright |
| Agent tests | All agent actions with mock MCP | Custom harness |

- Tests run in CI on every PR
- PRs may not reduce coverage below the target
- Test files live adjacent to implementation: `foo.ts` → `foo.test.ts`

---

## 7. API Design

- REST API follows the conventions in [API Standards](api.md)
- All endpoints documented in OpenAPI 3.1 before implementation
- No undocumented endpoints in production
- Versioning: `/api/v1/` prefix; breaking changes require `/api/v2/`

---

## 8. Error Handling

All errors returned by the API must follow the [Error Schema](../schemas/api-schemas.md).

```
{
  "error": {
    "code": "TASK_NOT_FOUND",       // machine-readable, SCREAMING_SNAKE_CASE
    "message": "Task not found.",   // human-readable
    "details": {}                   // optional structured context
  }
}
```

- Never expose stack traces in production responses
- Never expose internal IDs or implementation details in errors
- Log the full error context server-side; return only the safe summary to clients

---

## 9. Secrets & Configuration

- Secrets are never committed to any repository
- Secrets are injected via environment variables
- `.env.example` files document required variables without values
- Production secrets are stored in a secrets manager (Vault, AWS Secrets Manager, or equivalent)

---

## 10. Dependencies

- Evaluate all new dependencies for:
  - License compatibility (MIT, Apache 2.0, BSD preferred)
  - Security vulnerability history
  - Maintenance activity (last commit < 12 months)
  - Bundle size impact (frontend dependencies)
- Dependency updates are automated via Dependabot
- CVE fixes are applied within 72 hours of disclosure

---

## 11. Performance Baselines

Performance requirements from PRDs are enforced via load tests in CI (staging environment).

| Tier | P95 Response | Notes |
|------|-------------|-------|
| Read (single entity) | ≤ 200ms | Enforced from Phase 1 |
| Read (list, ≤ 100 items) | ≤ 300ms | Enforced from Phase 1 |
| Write | ≤ 500ms | Enforced from Phase 1 |
| Agent action | ≤ 5s | Enforced from Phase 3 |

Regressions in performance baselines block deployment.

---

## 12. Logging & Observability

- Structured JSON logging (no unstructured string concatenation)
- Required log fields: `timestamp`, `level`, `service`, `trace_id`, `user_id` (if available)
- Trace IDs propagated across all service calls
- Metrics exported in Prometheus format
- Dashboards defined in code (Grafana-as-code or equivalent)

---

## 13. Documentation

- Every public API endpoint has an OpenAPI schema entry
- Every public function has a docstring/JSDoc comment
- READMEs are required in every package/service directory
- Architecture decisions are recorded as ADRs before implementation begins
