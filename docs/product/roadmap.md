# Product Roadmap

## Overview

LifeOS Enterprise is built in seven sequential phases. Each phase delivers independently useful value while laying the foundation for the next.

---

## Phase Summary

| Phase | Name | Goal | PRD |
|-------|------|------|-----|
| 1 | Foundation | Core data model, auth, projects, tasks, basic UI | [PRD-001](prd/PRD-001-foundation.md) |
| 2 | Knowledge Graph | Notes, documents, entity linking, search | [PRD-002](prd/PRD-002-knowledge-graph.md) |
| 3 | AI Agents | Named agents, context injection, action execution | [PRD-003](prd/PRD-003-ai-agents.md) |
| 4 | MCP Integrations | External tool integrations via MCP servers | [PRD-004](prd/PRD-004-mcp-integrations.md) |
| 5 | Business Modules | TradeIQ, Alternative, ClientVerse domain logic | [PRD-005](prd/PRD-005-business-modules.md) |
| 6 | Automation | Event-driven workflow engine, scheduled jobs | [PRD-006](prd/PRD-006-automation.md) |
| 7 | SaaS Platform | Multi-tenant, billing, onboarding, marketplace | [PRD-007](prd/PRD-007-saas-platform.md) |

---

## Phase 1: Foundation

**Goal:** A working single-operator system with projects, tasks, contacts, and authentication.

**Exit criteria:**
- Operator can log in, create a business unit, add projects and tasks
- Every project displays its next action
- Contacts can be linked to projects and tasks
- Data is stored durably and accessible via API

---

## Phase 2: Knowledge Graph

**Goal:** Every entity is connected. Notes and decisions are findable.

**Exit criteria:**
- Notes can be created and linked to projects, tasks, or contacts
- Semantic search returns relevant results across all entity types
- Related items are surfaced automatically on any entity view
- Knowledge graph visualizer shows entity relationships

---

## Phase 3: AI Agents

**Goal:** The first AI agent delivers the daily briefing and can create tasks.

**Exit criteria:**
- "Morning Brief" agent summarizes open tasks, overdue items, and priorities
- "Task Creator" agent creates and assigns tasks from natural language input
- All agent actions are logged and reversible
- Agent confidence thresholds route to human approval when needed

---

## Phase 4: MCP Integrations

**Goal:** External tools are accessible to agents and visible in the platform.

**Exit criteria:**
- Calendar integration: events visible in project context
- Email/Slack integration: tagged messages become tasks
- GitHub integration: PR/issue status visible on project
- Finance integration: invoice status visible on project
- All integrations are MCP-server based

---

## Phase 5: Business Modules

**Goal:** Domain-specific views and logic for each business unit.

**Exit criteria:**
- TradeIQ: position summaries, trade notes, strategy tracking
- Alternative: deal pipeline, investor CRM, fund reporting hooks
- ClientVerse: client project boards, deliverable tracking, invoicing

---

## Phase 6: Automation

**Goal:** Routine coordination runs without operator input.

**Exit criteria:**
- Workflow engine triggers on platform events
- 10 pre-built automation templates available
- Operators can define custom automations without code
- Automation execution log is auditable

---

## Phase 7: SaaS Platform

**Goal:** Other operators can use LifeOS Enterprise without self-hosting.

**Exit criteria:**
- Multi-tenant data isolation verified
- Billing integration (Stripe) live
- Self-serve onboarding completes in < 10 minutes
- Marketplace for community-built MCP integrations

---

## Guiding Principles for Phasing

1. Each phase must be usable without the next phase
2. No phase skips the spec-first process
3. Security requirements apply from Phase 1
4. Performance baselines are defined per phase and not relaxed in subsequent phases
