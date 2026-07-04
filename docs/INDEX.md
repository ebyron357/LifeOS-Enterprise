# LifeOS — Documentation Index

> All architecture, design, and operational documentation for the LifeOS platform.

---

## Execution Engine

| Document | Description |
|----------|-------------|
| [EXECUTION_ENGINE.md](./EXECUTION_ENGINE.md) | Priority Engine, ROI Engine, Blocker Engine, and Recommendation Engine |
| [COMMAND_CENTER.md](./COMMAND_CENTER.md) | Command Center dashboard design and aggregation logic |
| [DECISION_ENGINE.md](./DECISION_ENGINE.md) | Decision recording framework and lifecycle |
| [REVIEW_ENGINE.md](./REVIEW_ENGINE.md) | Daily, weekly, monthly, quarterly, and annual review workflows |
| [SEARCH_ARCHITECTURE.md](./SEARCH_ARCHITECTURE.md) | Universal search design (FTS + semantic) |
| [SYSTEM_RELATIONSHIPS.md](./SYSTEM_RELATIONSHIPS.md) | Cross-object relationship map for all entities |
| [HEALTH_SCORING.md](./HEALTH_SCORING.md) | Health score calculation formulas (9 dimensions) |

---

## AI Orchestration

| Document | Description |
|----------|-------------|
| [../ai/AI_ORCHESTRATION.md](../ai/AI_ORCHESTRATION.md) | Master AI orchestration architecture |
| [../ai/ORCHESTRATOR.md](../ai/ORCHESTRATOR.md) | Central dispatcher: agent selection, execution, and logging |
| [../ai/CONTEXT_ENGINE.md](../ai/CONTEXT_ENGINE.md) | Context assembly pipeline and token budget management |
| [../ai/MEMORY_ARCHITECTURE.md](../ai/MEMORY_ARCHITECTURE.md) | 5-layer memory system with retention and retrieval |
| [../ai/AGENT_COORDINATION.md](../ai/AGENT_COORDINATION.md) | Agent communication protocols and dependency tracking |
| [../ai/TOOL_ROUTING.md](../ai/TOOL_ROUTING.md) | Tool selection logic and authorization matrix |
| [../ai/APPROVAL_WORKFLOWS.md](../ai/APPROVAL_WORKFLOWS.md) | Human-in-the-loop approval design |

---

## Platform Implementation

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Tech stack, monorepo structure, milestones, and delivery order |
| [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) | Frontend component architecture and backend service design |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Complete PostgreSQL schema with DDL, indexes, and RLS |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | tRPC + REST API: auth, RBAC, pagination, search, errors |
| [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) | Auth, RBAC, encryption, secrets, audit log, threat model |
| [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) | Unit, integration, E2E, performance, security, AI validation |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | CI/CD pipeline, environments, monitoring, rollback |

---

## Agent Catalog

| Agent | README |
|-------|--------|
| Chief of Staff | [agents/chief-of-staff/README.md](../agents/chief-of-staff/README.md) |
| Project Manager | [agents/project-manager/README.md](../agents/project-manager/README.md) |
| Engineering Lead | [agents/engineering/README.md](../agents/engineering/README.md) |
| Knowledge Engineer | [agents/knowledge-engineer/README.md](../agents/knowledge-engineer/README.md) |
| Research Analyst | [agents/research/README.md](../agents/research/README.md) |
| Automation Architect | [agents/automation-architect/README.md](../agents/automation-architect/README.md) |
| Marketing Strategist | [agents/marketing-strategist/README.md](../agents/marketing-strategist/README.md) |
| Sales Strategist | [agents/sales-strategist/README.md](../agents/sales-strategist/README.md) |
| Finance Advisor | [agents/finance-advisor/README.md](../agents/finance-advisor/README.md) |
| Legal Advisor | [agents/legal-advisor/README.md](../agents/legal-advisor/README.md) |
| UI/UX Designer | [agents/ui-ux-designer/README.md](../agents/ui-ux-designer/README.md) |
| QA Engineer | [agents/qa-engineer/README.md](../agents/qa-engineer/README.md) |
| DevOps Engineer | [agents/devops-engineer/README.md](../agents/devops-engineer/README.md) |
| Security Advisor | [agents/security-advisor/README.md](../agents/security-advisor/README.md) |
| Documentation Specialist | [agents/documentation-specialist/README.md](../agents/documentation-specialist/README.md) |

---

## Module Documentation

| Module | README |
|--------|--------|
| Schemas | [schemas/](../schemas/) — 15+ JSON schemas |
| Command Center Templates | [command-center/](../command-center/) — Daily/weekly/monthly/quarterly/annual |
| Decisions | [decisions/README.md](../decisions/README.md) |
| AI Module | [ai/](../ai/) |
| Knowledge | [knowledge/](../knowledge/) |
| Projects | [projects/](../projects/) |
| Agents | [agents/](../agents/) |
| MCP | [mcp/](../mcp/) |

---

## Product Vision

| Document | Description |
|----------|-------------|
| [../ROADMAP.md](../ROADMAP.md) | Product roadmap |
| [../MVP.md](../MVP.md) | MVP scope and definition |
| [../PRODUCT_VISION.md](../PRODUCT_VISION.md) | Long-term product vision |
