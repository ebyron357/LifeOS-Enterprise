# PRD-003: AI Agents

**Status:** Draft
**Phase:** 3
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

The AI Agents phase introduces named, scoped agents that can read and act on platform data. Agents are first-class entities with defined capabilities, confidence thresholds, and audit logs. The first agents are the Morning Brief and Task Creator.

---

## Goals

1. Named agents are defined with scopes, capabilities, and MCP tool access
2. The Morning Brief agent delivers a daily context summary
3. The Task Creator agent creates tasks from natural language
4. All agent actions are logged, auditable, and reversible
5. Low-confidence actions are routed to human approval

---

## Non-Goals

- No autonomous long-running agent loops in this phase (single-shot actions only)
- No agent-to-agent communication in this phase
- No custom agent builder for operators in this phase

---

## Agent Definitions

### Agent: Morning Brief

**Purpose:** Deliver a daily operational summary to the operator
**Trigger:** Scheduled (configurable time, default 08:00 local)
**Scope:** Read access to all business units the operator has access to
**Output:** Structured briefing document linked to operator's note feed

**Briefing contents:**
1. Overdue tasks (grouped by project)
2. Tasks due today
3. Projects with no next action defined
4. New items since last brief (notes, decisions, contacts)
5. Upcoming events (if calendar integration active)

**Confidence model:** Briefings are informational only — no approval flow required

### Agent: Task Creator

**Purpose:** Create tasks from natural language input
**Trigger:** Operator message (via chat interface or API)
**Scope:** Write access to tasks; read access to projects and contacts
**Output:** Created task(s) with confirmation summary

**Behavior:**
1. Parse operator input for task intent, project context, due date, assignee
2. Resolve ambiguous project references using knowledge graph
3. If > 90% confidence: create task, return confirmation
4. If 70–90% confidence: show task draft for operator confirmation
5. If < 70% confidence: ask clarifying question

---

## Acceptance Criteria

### AC-001: Agent Framework
- [ ] Agents are defined in configuration (name, description, scope, tools, model)
- [ ] Each agent action is logged with: agent ID, timestamp, input, output, confidence, approved_by
- [ ] Agent actions can be undone within 30 minutes of execution
- [ ] Agent access is limited to their defined scope — no cross-scope data access
- [ ] Agent execution failures are logged and surfaced to the operator

### AC-002: Morning Brief
- [ ] Briefing delivered within 5 minutes of scheduled time
- [ ] Briefing format is consistent and parseable
- [ ] Briefing skipped if operator has no open items (with notification)
- [ ] Operator can configure: delivery time, included sections, notification channel

### AC-003: Task Creator
- [ ] Task creation from natural language in ≤ 3 seconds end-to-end
- [ ] Project resolution accuracy ≥ 90% in test suite
- [ ] Ambiguous inputs reliably trigger clarification (< 5% false negative rate)
- [ ] Created tasks are identical to manually created tasks (same schema)

### AC-004: Audit & Control
- [ ] Operator can view full agent action history with filters
- [ ] Operator can disable any agent with immediate effect
- [ ] Operator can replay any agent action with modified input
- [ ] All agent-created/modified entities are marked with `created_by: agent:{agent_id}`

---

## Agent Schema

See [schemas/core-entities.md](../../schemas/core-entities.md) for the `Agent` and `AgentAction` entity definitions.

---

## MCP Integration

Each agent's tools are provided by MCP servers. See [mcp/README.md](../../../mcp/README.md) for the integration catalog.

Morning Brief MCP servers:
- `lifeos-tasks` — read tasks and projects
- `lifeos-notes` — read notes and decisions
- `lifeos-calendar` (optional) — read events

Task Creator MCP servers:
- `lifeos-tasks` — read + write tasks and projects
- `lifeos-contacts` — read contacts
- `lifeos-knowledge` — read knowledge graph for entity resolution
