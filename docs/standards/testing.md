# Testing Standards

## Purpose

These standards define what must be tested, how tests are organized, and what coverage is required across all LifeOS Enterprise implementation repositories.

---

## 1. Testing Pyramid

```
         ┌───────────────────┐
         │   E2E Tests (few) │
         │   Critical paths   │
         └────────┬──────────┘
              ┌───┴───────────────────┐
              │  Integration Tests    │
              │  (every API endpoint) │
              └───────┬───────────────┘
           ┌──────────┴──────────────────────┐
           │         Unit Tests              │
           │  (business logic, utilities)    │
           └─────────────────────────────────┘
```

---

## 2. Coverage Requirements

| Test Level | Minimum Coverage | Tool (TypeScript) | Tool (Python) |
|------------|-----------------|-------------------|---------------|
| Unit | 80% line coverage | Vitest | pytest-cov |
| Integration | All API endpoints covered | Supertest / httpx | httpx |
| E2E | All critical user journeys | Playwright | Playwright |

Coverage is measured in CI. PRs that reduce coverage below the threshold are blocked.

---

## 3. Unit Tests

Unit tests cover:
- Domain logic (business rules, calculations, validations)
- Utility functions
- Data transformations
- Error cases and edge cases

Unit tests must:
- Be fast (< 50ms per test)
- Not make network calls or database queries (use mocks/stubs)
- Be isolated — no shared mutable state between tests
- Use descriptive test names that read as requirements: `"should return 404 when task does not exist"`

---

## 4. Integration Tests

Integration tests cover:
- Every API endpoint (happy path + error cases)
- Database queries with a real test database
- External service integrations with a test double (recorded responses or sandbox)

Integration tests must:
- Use a separate test database, reset between test runs
- Cover auth flows: unauthenticated, wrong role, correct role
- Cover business unit isolation: verify requests cannot access data from another BU

---

## 5. End-to-End Tests

E2E tests cover the following critical user journeys (minimum):

1. Registration → Login → Create business unit → Create project → Create task → Complete task
2. Create note → Link to project → Search and find note
3. Agent creates task from natural language input
4. Automation triggers on event and creates follow-up task

E2E tests run against a staging environment, not production. They run on every merge to `main`.

---

## 6. Agent Testing

Agent tests verify:
- Agent receives correct context given a scenario
- Agent produces the correct action type with appropriate parameters
- Agent confidence thresholds route correctly (approve / request review)
- Agent action is correctly logged and reversible

Agent tests use a mock MCP server that returns controlled responses. LLM calls are stubbed with recorded responses for determinism.

---

## 7. Test Data

- Test data is generated programmatically — no hardcoded data files
- Test data factories produce entities that satisfy all required fields
- PII in test data uses fake/synthetic values only — never real customer data
- Shared test fixtures are documented and centrally managed

---

## 8. Test File Organization

```
src/
  tasks/
    tasks.service.ts
    tasks.service.test.ts        # unit tests
    tasks.controller.ts
    tasks.controller.test.ts     # unit tests
tests/
  integration/
    tasks.api.test.ts            # integration tests
  e2e/
    task-workflow.spec.ts        # E2E tests
```

---

## 9. CI Requirements

- All tests run on every PR
- PRs may not merge if any test fails
- Flaky tests are tracked and fixed within 2 sprints — they are not simply skipped
- Test execution time target: unit tests < 60s; integration tests < 5 minutes; E2E < 15 minutes

---

## 10. Security Testing

- OWASP ZAP scan run before each production release
- SQL injection and XSS test cases included in integration test suite
- Authorization boundary tests: verify cross-BU isolation on every resource type
- Agent scope boundary tests: verify agents cannot access beyond their defined scope
