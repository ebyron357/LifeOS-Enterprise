# LifeOS — Testing Strategy

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect / QA Engineer  
> **Last Updated:** 2026-07-04

---

## Overview

LifeOS is tested at every layer: unit, integration, end-to-end, performance, security, and AI validation. Tests are not optional. No feature ships without corresponding tests. The goal is a test suite that provides high confidence in changes without becoming a burden to maintain.

---

## Testing Philosophy

1. **Test behavior, not implementation** — Tests describe what the system should do, not how it does it
2. **Every public API has a test** — All tRPC procedures and REST endpoints are integration-tested
3. **Critical flows have E2E coverage** — Anything a user must be able to do has an E2E test
4. **AI outputs are validated by contract** — AI agent outputs are validated for format, not content
5. **Security tests run on every PR** — Security regressions are never acceptable

---

## Testing Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Unit | **Vitest** | Fast, native ESM, built-in TypeScript |
| Integration | **Vitest + tRPC test client** | Tests full tRPC routers with real DB |
| E2E | **Playwright** | Cross-browser, full user flows |
| Performance | **k6** | Load testing scripts in `/tests/performance/` |
| Security | **OWASP ZAP + npm audit** | CI-integrated security scans |
| Mocking | **MSW (Mock Service Worker)** | Intercepts network in unit tests |
| DB (test) | **Docker Compose (PostgreSQL)** | Isolated test database, wiped per suite |
| Coverage | **Vitest + c8** | Coverage reports in CI |

---

## Unit Testing

### Scope
Unit tests cover pure functions, service logic, validators, and utilities that have no external dependencies.

### Location
```
packages/
  validators/
    __tests__/
      project.test.ts
      knowledge.test.ts
  utils/
    __tests__/
      priority.test.ts
      scoring.test.ts
  ai/
    __tests__/
      context-engine.test.ts
      tool-router.test.ts
apps/
  web/
    __tests__/
      components/
        ProjectCard.test.tsx
```

### Coverage Targets
| Module | Target |
|--------|--------|
| Validators | 100% |
| Utility functions | 100% |
| Scoring / priority logic | 100% |
| UI components (unit) | 80% |
| Service logic | 90% |

### Patterns

**Testing a validator:**
```typescript
describe('createProjectSchema', () => {
  it('rejects a title shorter than 3 characters', () => {
    const result = createProjectSchema.safeParse({ title: 'AB', businessId: validUuid })
    expect(result.success).toBe(false)
  })

  it('accepts a valid project with all required fields', () => {
    const result = createProjectSchema.safeParse(validProject)
    expect(result.success).toBe(true)
  })
})
```

**Testing a scoring function:**
```typescript
describe('calculatePriorityScore', () => {
  it('returns maximum score for critical priority + overdue deadline', () => {
    const score = calculatePriorityScore({ priority: 'critical', daysUntilDeadline: -1 })
    expect(score).toBeGreaterThanOrEqual(90)
  })
})
```

---

## Integration Testing

### Scope
Integration tests cover tRPC routers end-to-end, from the HTTP request through the database and back. They use a real PostgreSQL test database seeded with fixtures.

### Location
```
tests/
  integration/
    business.test.ts
    project.test.ts
    knowledge.test.ts
    decision.test.ts
    search.test.ts
    agent.test.ts
    auth.test.ts
  fixtures/
    seed.ts           ← Seeds test database before each suite
    factories/        ← Factory functions for test entities
```

### Test Database Setup
```
1. Docker Compose starts a PostgreSQL instance on a random port
2. Drizzle migrations are applied to the test database
3. seed.ts runs to create org, users, and base entities
4. Each test suite clears its own state; does not depend on other suites
5. After CI, Docker Compose brings the database down
```

### Patterns

**Testing a tRPC router:**
```typescript
describe('project router', () => {
  let ctx: TestContext

  beforeEach(async () => {
    ctx = await createTestContext({ role: 'admin' })
  })

  it('creates a project and returns it', async () => {
    const result = await ctx.client.project.create.mutate({
      businessId: ctx.business.id,
      title: 'New Project',
      priority: 'high',
    })
    expect(result.id).toBeDefined()
    expect(result.title).toBe('New Project')
  })

  it('refuses to create a project for another org', async () => {
    await expect(
      ctx.client.project.create.mutate({ businessId: otherOrgBusinessId, title: 'X' })
    ).rejects.toThrow('FORBIDDEN')
  })
})
```

---

## End-to-End Testing

### Scope
E2E tests cover critical user flows through the real UI in a Chromium browser. They run against the staging environment.

### Critical Flows (Required E2E Coverage)

| Flow | Priority |
|------|---------|
| User sign up and first org setup | Critical |
| Create business + project + task | Critical |
| Add knowledge object and search for it | Critical |
| Record a decision (propose → finalize) | Critical |
| Dispatch an agent task and approve it | Critical |
| Universal search returning results | Critical |
| Complete daily review | High |
| Invite team member with viewer role | High |
| Connect GitHub repository | High |
| Archive a business (soft delete) | Medium |

### Location
```
tests/
  e2e/
    auth/
      signup.spec.ts
      login.spec.ts
    command-center/
      dashboard.spec.ts
    projects/
      create-project.spec.ts
      project-detail.spec.ts
    decisions/
      decision-lifecycle.spec.ts
    agents/
      dispatch-task.spec.ts
      approve-task.spec.ts
    search/
      universal-search.spec.ts
```

### E2E Patterns

```typescript
test('user can create a project from the command center', async ({ page }) => {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'New Project' }).click()
  await page.getByLabel('Title').fill('Marketing Campaign Q3')
  await page.getByLabel('Priority').selectOption('high')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByText('Marketing Campaign Q3')).toBeVisible()
})
```

---

## Performance Testing

### Scope
Performance tests validate that the API meets latency SLAs under expected load.

### SLA Targets
| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| `GET /api/v1/projects` (list, 25 items) | < 100ms | < 250ms | < 500ms |
| `GET /api/v1/search?q=...` (FTS) | < 200ms | < 500ms | < 1,000ms |
| `GET /api/v1/search?mode=semantic` | < 800ms | < 1,500ms | < 3,000ms |
| `POST /api/v1/agents/:id/dispatch` | < 500ms | < 1,000ms | < 2,000ms |
| `GET /api/v1/health` (health scores) | < 150ms | < 400ms | < 800ms |

### Test Scenarios

| Scenario | VUs | Duration | Purpose |
|---------|-----|----------|--------|
| Baseline load | 10 | 5 min | Normal usage |
| Peak load | 100 | 5 min | Busy period |
| Sustained load | 50 | 30 min | Memory leaks |
| Spike test | 0 → 200 → 0 | 2 min | Auto-scaling |
| Search stress | 50 | 5 min | Search-specific |

### Location
```
tests/
  performance/
    baseline.js
    peak-load.js
    search-stress.js
    spike.js
```

---

## Security Testing

### Automated (CI)

| Tool | What It Checks | When |
|------|---------------|------|
| `npm audit` | Known CVEs in dependencies | Every PR |
| Secret Scanner (custom) | Hardcoded secrets in code | Every PR |
| OWASP ZAP (baseline scan) | OWASP Top 10 basics | Every staging deploy |
| Semgrep | Common code vulnerabilities | Every PR |

### Manual

| Activity | Frequency |
|---------|----------|
| Manual penetration test (external) | Quarterly |
| RBAC permission review | Monthly |
| Dependency audit review | Monthly |
| Threat model review | Bi-annually |

### Security Test Location
```
tests/
  security/
    rbac.test.ts        ← Tests every permission boundary
    org-isolation.test.ts  ← Tests cross-org data access is blocked
    input-validation.test.ts  ← Tests malicious input handling
```

---

## AI Validation Testing

### Scope
AI agent outputs cannot be tested for correctness (the content depends on LLM behavior). Instead, AI validation tests verify:
1. The **output format** matches the expected schema
2. The **approval workflow** triggers correctly based on autonomy level
3. The **context payload** is assembled correctly before dispatch
4. **Fallback behavior** activates when an agent fails

### Location
```
tests/
  ai/
    context-engine.test.ts   ← Tests context assembly
    orchestrator.test.ts     ← Tests agent selection logic
    approval-flow.test.ts    ← Tests approval triggers
    fallback.test.ts         ← Tests failure handling
```

### Patterns

```typescript
describe('context engine', () => {
  it('assembles context within the 6000-token budget', async () => {
    const context = await assembleContext({ projectId: 'uuid', intent: 'plan_sprint' })
    const tokenCount = estimateTokens(context)
    expect(tokenCount).toBeLessThanOrEqual(6000)
  })
})

describe('agent output validation', () => {
  it('rejects agent output that does not match the expected schema', () => {
    const invalidOutput = { result: 'just a string' }
    expect(() => agentOutputSchema.parse(invalidOutput)).toThrow()
  })
})
```

---

## Regression Testing

### Policy
- All merged PRs must pass the full unit + integration test suite in CI
- E2E tests run on every staging deploy
- If a bug is fixed, a test must be added to cover that bug (no silent regressions)

### CI Pipeline (Tests)
```yaml
# Runs on every PR
test:
  - lint (ESLint + TypeScript check)
  - unit tests (Vitest)
  - integration tests (Vitest + Docker PostgreSQL)
  - secret scan
  - npm audit

# Runs on every staging deploy
staging-tests:
  - E2E tests (Playwright)
  - OWASP ZAP baseline scan
  - Performance smoke test (baseline scenario, 5 min)
```

---

## Test Data Management

### Principles
- No production data in tests
- All test data created by factories and wiped after each suite
- Factory functions produce valid, Zod-parseable entities

### Factories
```
tests/
  fixtures/
    factories/
      business.factory.ts
      project.factory.ts
      knowledge.factory.ts
      decision.factory.ts
      user.factory.ts
```

Each factory creates an entity with sensible defaults and allows field overrides:
```typescript
const project = projectFactory.build({ priority: 'critical', status: 'active' })
```
