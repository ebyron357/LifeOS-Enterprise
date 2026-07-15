# LifeOS — Implementation Backlog

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect  
> **Last Updated:** 2026-07-04

---

## Audit Summary

This backlog is derived from the canonical specification in `/docs`, `/ai`, and the module READMEs/templates/schemas across the repository.

### Current Repository State

- **Implementation mode:** Repository-first system with future web/SaaS platform expansion
- **Code status:** No application code exists yet
- **Structured assets present:** 15 JSON schemas, agent definitions, business/project templates, command-center review templates
- **Primary gap:** Runtime implementation is largely absent; most platform and automation features are still specification-only

### Status Definitions

- **Not Started** — No working implementation exists beyond specification text
- **In Progress** — Partial repository assets exist, but the feature is not yet operational end-to-end
- **Complete** — The feature exists in the repository in usable form for its current phase

### Planning Decision

The smallest production-ready cut follows `docs/MVP.md`: **complete the repository-first operator system first**.  
The full web application, database-backed APIs, and enterprise SaaS architecture remain valid, but they are **post-MVP milestones** after the repository-first system is operational.

---

## Phase 1 — Implementation Audit

| Feature | Epic | Status | Dependencies | Complexity | Order |
|---|---|---:|---|---|---:|
| Repository standards docs (`NAMING_CONVENTIONS.md`, `STANDARDS.md`, `REPOSITORY_GUIDE.md`, `METADATA_SCHEMA.md`) | Core Foundation | Not Started | None | Medium | 1 |
| Top-level module structure and READMEs | Core Foundation | Complete | None | Low | 1 |
| JSON schema registry (15 schemas) | Core Foundation | Complete | None | Medium | 1 |
| Business template scaffold | Business OS | Complete | Schema registry | Medium | 2 |
| Project, risk, decision, deliverable templates | Project OS | Complete | Schema registry | Medium | 2 |
| Knowledge object template and index | Knowledge Engine | In Progress | Schema registry | Medium | 3 |
| Decision registry structure and lifecycle rules | Decision Center | In Progress | Project OS | Low | 3 |
| Command center daily/weekly/monthly/quarterly/annual templates | Command Center | In Progress | Project OS, Decision Center, Knowledge Engine | Medium | 4 |
| Agent catalog and role definitions | AI Workspace | In Progress | Knowledge Engine, MCP Hub | High | 4 |
| Chief of Staff orchestration model | AI Workspace | In Progress | Agent catalog, MCP Hub | High | 5 |
| Project Manager agent model | AI Workspace | In Progress | Agent catalog, Project OS | Medium | 5 |
| Remaining specialist agent definitions | AI Workspace | In Progress | Agent catalog | Medium | 8 |
| MCP connector template and connector registry structure | MCP Hub | Not Started | Standards docs | High | 4 |
| GitHub MCP connector | MCP Hub | Not Started | MCP registry, secrets handling | High | 5 |
| Claude/OpenAI model connector | MCP Hub | Not Started | MCP registry, secrets handling | High | 5 |
| Slack MCP connector | MCP Hub | Not Started | MCP registry, secrets handling | Medium | 6 |
| Additional MCP connectors (NotebookLM, Drive, Stripe, Vercel, Supabase, etc.) | MCP Hub | Not Started | MCP registry | High | 9 |
| Workflow definition library | Automation Engine | Not Started | MCP Hub, AI Workspace | High | 6 |
| Automation rule library | Automation Engine | Not Started | Workflow definitions | High | 6 |
| Daily briefing workflow | Automation Engine | Not Started | Chief of Staff, GitHub/Model connectors, Command Center | High | 6 |
| Weekly review workflow | Automation Engine | Not Started | Project OS, Knowledge Engine, Command Center | High | 6 |
| Priority, ROI, blocker, recommendation engines | Business Engine | Not Started | Project OS, Decision Center, Knowledge Engine | High | 7 |
| Review engine packet assembly | Business Engine | Not Started | Command Center, Automation Engine | Medium | 7 |
| Health scoring engine | Business Engine | Not Started | Business OS, Project OS, Knowledge Engine | Medium | 7 |
| Universal search architecture/runtime | Search | Not Started | Schema registry, Knowledge Engine, Project OS | High | 8 |
| Dashboard specifications | Dashboard Engine | Not Started | Business Engine outputs | Medium | 8 |
| Business instances (first real business) | Business OS | Not Started | Business template, standards docs | Low | 3 |
| Initial project backlog (first 5 active projects) | Project OS | Not Started | Business instance, project templates | Low | 3 |
| Initial knowledge objects | Knowledge Engine | Not Started | Knowledge template, initial projects | Low | 4 |
| People registry and profiles | Settings / People | Not Started | Standards docs | Medium | 4 |
| Finance templates and first financial review assets | Finance Hub | Not Started | Business instance | Medium | 8 |
| CRM templates and first pipeline assets | CRM | Not Started | Business instance, People registry | Medium | 8 |
| SOP template and platform SOPs | Operations | Not Started | Standards docs, workflows | Medium | 5 |
| GitHub repository registry and standards assets | GitHub Integration | Not Started | GitHub MCP connector | Medium | 7 |
| Schema validation automation in GitHub Actions | GitHub Integration | Not Started | Schema registry, standards docs | Medium | 2 |
| Repository health reporting | GitHub Integration | Not Started | GitHub MCP connector, dashboards | Medium | 8 |
| NotebookLM source/output registry | Knowledge Engine | Not Started | NotebookLM connector | Medium | 9 |
| Learning system templates and records | Learning System | Not Started | People registry, Knowledge Engine | Medium | 9 |
| Monorepo scaffolding (`apps/`, `packages/`, tooling) | Platform Core | Not Started | MVP exit approval | High | 10 |
| Authentication and RBAC | Platform Core | Not Started | Monorepo scaffold, DB layer | High | 11 |
| PostgreSQL/Drizzle data layer | Platform Core | Not Started | Monorepo scaffold | High | 11 |
| tRPC/REST API layer | Platform Core | Not Started | Data layer, auth | High | 12 |
| Next.js dashboard application shell | Platform Core | Not Started | API layer, auth | High | 12 |
| Search runtime (FTS + semantic) | Search | Not Started | Data layer, embeddings, API layer | High | 13 |
| Deployment pipeline (Vercel/Supabase/Upstash) | Deployment | Not Started | Monorepo scaffold, CI | High | 13 |
| Testing stack (Vitest/Playwright/k6/ZAP) | Quality | Not Started | Monorepo scaffold, CI | High | 13 |
| Runtime security controls (JWT, RLS, audit log, secret vaulting) | Security | Not Started | Data layer, auth, deployment | High | 13 |

---

## Phase 2 — Epic Planning

### Epic 1 — Core Foundation

- **Goal:** Close the remaining documentation and governance gaps so the repository-first system can be operated consistently.
- **Dependencies:** None
- **Acceptance Criteria:**
  - Missing MVP documents exist and are internally consistent
  - Naming and metadata rules are explicit
  - Schema validation can be enforced in CI
  - Onboarding can be completed from documentation alone
- **Estimated Effort:** Medium
- **Priority:** P0

### Epic 2 — Operator OS

- **Goal:** Make the repository usable for a single operator managing one real business, active projects, decisions, reviews, and knowledge.
- **Dependencies:** Core Foundation
- **Acceptance Criteria:**
  - At least one real business instance exists
  - At least five active projects exist with next actions and review dates
  - Decision, risk, and knowledge flows are actively used
  - Daily and weekly command-center records can be completed without missing fields
- **Estimated Effort:** Medium
- **Priority:** P0

### Epic 3 — AI Workspace

- **Goal:** Turn the existing agent definitions into operational assistants, starting with Chief of Staff and Project Manager.
- **Dependencies:** Operator OS, MCP Hub
- **Acceptance Criteria:**
  - Chief of Staff can generate the daily briefing
  - Project Manager can identify stale projects and missing next actions
  - Agent prompts, escalation rules, and memory boundaries are executable
  - Agent outputs feed command-center and project workflows
- **Estimated Effort:** High
- **Priority:** P0

### Epic 4 — MCP Hub

- **Goal:** Stand up the minimum connector layer required for agents and workflows to interact with external systems.
- **Dependencies:** Core Foundation, Security controls for secrets handling
- **Acceptance Criteria:**
  - GitHub connector works end-to-end
  - Claude or OpenAI connector works end-to-end
  - Slack connector works end-to-end
  - Connector health and auth status are visible and documented
- **Estimated Effort:** High
- **Priority:** P0

### Epic 5 — Automation Engine

- **Goal:** Implement the workflows and trigger rules that keep the repository-first system moving without manual assembly.
- **Dependencies:** AI Workspace, MCP Hub, Operator OS
- **Acceptance Criteria:**
  - Daily briefing workflow runs on schedule or on demand
  - Weekly review packet can be auto-assembled
  - Workflow failures are logged and surfaced
  - At least three foundational workflows are operational
- **Estimated Effort:** High
- **Priority:** P1

### Epic 6 — Business Engine

- **Goal:** Implement the deterministic engines that calculate priorities, blockers, ROI, health, and review packets.
- **Dependencies:** Operator OS, Automation Engine
- **Acceptance Criteria:**
  - Priority and blocker outputs are traceable to source records
  - Review packets assemble from canonical sources only
  - Health scoring follows the documented formulas
  - Recommendation outputs are actionable and non-duplicative
- **Estimated Effort:** High
- **Priority:** P1

### Epic 7 — Knowledge Engine

- **Goal:** Move from knowledge templates to an actively compounding knowledge system used by agents and reviews.
- **Dependencies:** Operator OS, AI Workspace, MCP Hub
- **Acceptance Criteria:**
  - New knowledge objects can be created from work and review cycles
  - Objects are linked to businesses and projects
  - Knowledge review queue is populated
  - Agents can consume knowledge context intentionally
- **Estimated Effort:** Medium
- **Priority:** P1

### Epic 8 — GitHub Integration

- **Goal:** Connect repository activity, CI results, and project status through GitHub-centered workflows.
- **Dependencies:** MCP Hub, Automation Engine
- **Acceptance Criteria:**
  - Repository registry exists
  - Schema validation runs in GitHub Actions
  - Repository health signals can be surfaced into the command center
  - GitHub events can update project/reporting flows
- **Estimated Effort:** Medium
- **Priority:** P1

### Epic 9 — Dashboard Engine

- **Goal:** Define and then operationalize the visibility layer that consumes outputs from the business engines.
- **Dependencies:** Business Engine, GitHub Integration, Automation Engine
- **Acceptance Criteria:**
  - Dashboard specs exist for all required views
  - Command Center consumes those specs without duplicating data
  - Repository, automation, and knowledge views have defined data contracts
  - Review surfaces reference the same canonical signals
- **Estimated Effort:** Medium
- **Priority:** P2

### Epic 10 — Business Support Modules

- **Goal:** Implement finance, CRM, people, SOP, and learning modules after the core operating loop is stable.
- **Dependencies:** Operator OS, Knowledge Engine, GitHub Integration
- **Acceptance Criteria:**
  - Finance, CRM, and people records can be created and reviewed
  - SOPs exist for recurring platform operations
  - Learning outputs can feed the knowledge engine
  - These modules participate in review cycles where required
- **Estimated Effort:** Medium
- **Priority:** P2

### Epic 11 — Platform Core

- **Goal:** Begin the web/SaaS implementation only after the repository-first MVP is operational and validated.
- **Dependencies:** MVP release gate
- **Acceptance Criteria:**
  - Monorepo scaffold exists
  - Auth, DB, API, and app shells align with the canonical platform docs
  - CI/CD, testing, and security baselines are in place
  - Work can proceed in vertical slices without re-architecting
- **Estimated Effort:** Very High
- **Priority:** P3

---

## Phase 3 — MVP Cut

### MVP Definition

The MVP is the **smallest production-ready repository-first version of LifeOS** that lets a single operator run one real business with structured projects, decisions, reviews, knowledge capture, two operational agents, and core connectors.

### Included in MVP

| Included Feature | Reason |
|---|---|
| Schema registry | Required for validation and consistent object structure |
| Missing standards/onboarding docs | Explicitly required by `docs/MVP.md` and `docs/USER_JOURNEYS.md` |
| Business template + first real business instance | The system needs a real operating context |
| Project templates + first active project backlog | Projects are the primary unit of execution |
| Decision and risk capture | Command Center and weekly review depend on them |
| Knowledge template + first knowledge objects | Institutional memory must start on day one |
| Daily and weekly command-center workflows | These are the core operator cadences |
| Chief of Staff + Project Manager operationalization | These are the two MVP-critical agents |
| GitHub + Claude/OpenAI + Slack connectors | Minimum external integration set with real operational value |
| Schema validation workflow | Prevents the repository from drifting immediately |

### Excluded from MVP

| Deferred Feature | Why It Moves Out |
|---|---|
| Full web application UI | `docs/MVP.md` explicitly defers it |
| PostgreSQL, Redis, Supabase, Vercel runtime | Needed for SaaS scale, not for initial operator value |
| Multi-user collaboration | Depends on auth, permissions, and conflict handling |
| Billing, SSO, enterprise security expansion | Post-MVP enterprise work |
| Additional agents beyond Chief of Staff and Project Manager | Valuable, but not required to prove daily usage |
| Most MCP connectors beyond GitHub/Slack/model access | Nice leverage, not core viability |
| Dashboard runtime implementation | Specs are useful; live app dashboards are not MVP-critical |
| Semantic search | High-value later, but not required to ship the first operator loop |

### MVP Decisions

1. **Follow `docs/MVP.md` over `docs/IMPLEMENTATION_PLAN.md` for the first shippable cut.**  
   The MVP document is the only file that explicitly defines the smallest production-ready version.

2. **Keep the first release repository-first.**  
   This removes auth, database, hosting, and UI complexity from the critical path.

3. **Ship the operating loop before the platform shell.**  
   Daily briefing, project hygiene, decisions, reviews, and knowledge capture create value immediately; the web app does not.

4. **Limit the AI surface area.**  
   Two operational agents prove the model without forcing all specialist roles into the first release.

5. **Limit integration scope to the connectors that unlock real daily use.**  
   GitHub, Slack, and one model provider are enough to validate the system.

---

## Phase 4 — Exact Implementation Order

Each step must end with a working, testable increment.

1. **Finish governance and validation foundations**
   - Deliver missing standards/onboarding documents
   - Add schema validation workflow
   - Result: repository can be onboarded and validated consistently

2. **Operationalize the repository object model**
   - Create the first business instance
   - Create the first five active projects with decisions, risks, and review dates
   - Result: the repository contains real, schema-aligned operating data

3. **Activate the minimum knowledge loop**
   - Create first knowledge objects and link them to projects/businesses
   - Define review/update expectations
   - Result: knowledge can be captured and reused

4. **Stand up the minimum connector set**
   - Implement GitHub, Claude/OpenAI, and Slack connectors
   - Document auth and health checks
   - Result: the system can read, reason, and notify across core tools

5. **Make Chief of Staff and Project Manager operational**
   - Bind existing agent definitions to the connector layer
   - Enable daily briefing and project hygiene use cases
   - Result: two agents can perform real operator work

6. **Implement the first workflows**
   - Daily briefing
   - Weekly review packet assembly
   - Project stale-item detection and escalation
   - Result: the operating loop runs without manual assembly

7. **Implement deterministic execution engines**
   - Priority, blocker, recommendation, review, and health outputs
   - Result: command-center inputs are computed from canonical records

8. **Define dashboard and repository health surfaces**
   - Add dashboard specifications and GitHub reporting flows
   - Result: all core signals have a defined visibility surface

9. **Expand into secondary business modules**
   - Finance, CRM, people, SOPs, learning
   - Result: the repository-first MVP becomes operationally complete

10. **Gate and begin the web platform foundation**
    - Start monorepo scaffold only after MVP exit criteria are met
    - Proceed to auth, DB, API, app shell, testing, deployment, and security in vertical slices
    - Result: the SaaS platform begins from a validated operating model instead of an unproven architecture

### Post-MVP Platform Build Order

1. Monorepo/tooling scaffold  
2. Database + migrations  
3. Authentication + RBAC  
4. Core CRUD APIs  
5. App shell + command-center UI  
6. Search + dashboards  
7. Agent runtime + job queue  
8. Additional connectors and automations  
9. Security, testing, deployment hardening  
10. Multi-user and enterprise extensions

---

## Immediate Priorities

1. Core Foundation  
2. Operator OS  
3. MCP Hub  
4. AI Workspace  
5. Automation Engine

These five epics are the critical path to an actual MVP. Everything else should wait behind them.
