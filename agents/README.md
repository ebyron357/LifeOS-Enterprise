# AI Agent Framework

## Overview

LifeOS Enterprise's AI agents are named, scoped, auditable assistants that perform defined tasks on behalf of operators. All agents are first-class entities — configured, logged, and controllable through the platform.

---

## Agent Principles

1. **Scoped** — every agent has an explicit list of tools it can use and data it can access
2. **Auditable** — every action is logged with input, output, confidence, and approval status
3. **Reversible** — actions that can be undone are reversible within 30 minutes
4. **Human-in-the-loop** — low-confidence actions route to human approval; high-impact actions require approval by default
5. **Transparent** — agents identify themselves (`created_by: agent:{id}`) on all their creations and modifications

---

## Agent Lifecycle

```
Define (spec) → Configure (platform) → Enable → Execute → Log → Review
                                                      ↑
                                              (repeat on trigger)
```

---

## Agent Configuration Schema

See [schemas/core-entities.md](../docs/schemas/core-entities.md#agent) for the full Agent entity schema.

Key configuration fields:
- `name` — human-readable agent name
- `description` — what the agent does and when it runs
- `model` — LLM to use (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`)
- `mcpServers` — list of MCP server IDs granting the agent its tools
- `confidenceThreshold` — actions below this require human approval
- `triggerType` — how the agent is invoked: `scheduled`, `event`, or `manual`

---

## Agent Catalog

### Platform Agents (Phase 3)

| Agent | Trigger | Purpose |
|-------|---------|---------|
| Morning Brief | Scheduled (daily) | Daily operational summary |
| Task Creator | Manual / Event | Create tasks from natural language |

### Business Module Agents (Phase 5)

| Agent | Business Unit | Trigger | Purpose |
|-------|--------------|---------|---------|
| Strategy Brief | TradeIQ | Scheduled (weekly) | Trading strategy performance summary |
| Pipeline Brief | Alternative | Scheduled (weekly) | Deal pipeline status summary |
| Client Health Brief | ClientVerse | Scheduled (weekly) | Client engagement health summary |
| Status Update Writer | ClientVerse | Manual | Generate client status update |

---

## MCP Integration

All agent tools are provided by MCP servers. Agents connect to MCP servers via the Model Context Protocol.

```
Agent
  │
  ├── lifeos-tasks (read + write tasks)
  ├── lifeos-projects (read projects)
  ├── lifeos-contacts (read contacts)
  ├── lifeos-knowledge (read knowledge graph)
  ├── lifeos-calendar (read calendar events)
  └── lifeos-finance (read invoice summaries)
```

Each MCP server exposes a defined set of tools. Agents only have access to the tools in their configured MCP server list.

See [mcp/README.md](../mcp/README.md) for the full MCP server catalog.

---

## Agent Action Flow

```
Trigger received
      │
      ▼
Agent invoked with context (scoped to permissions)
      │
      ▼
Agent reasons about action using LLM
      │
      ▼
Action plan produced
      │
      ▼
Confidence ≥ threshold?
      │
      ├── YES → Execute immediately → Log AgentAction (executed)
      │
      └── NO  → Queue AgentAction (pending) → Notify operator
                        │
                        ├── Operator approves → Execute → Log (approved + executed)
                        └── Operator rejects  → Log (rejected)
```

---

## Creating a New Agent

1. Add the agent definition to this file under the catalog
2. Create a PRD section or ADR if the agent introduces new MCP tools
3. Define the agent's MCP server requirements in [mcp/README.md](../mcp/README.md)
4. Write agent test cases (happy path, low confidence, out-of-scope attempt)
5. Reference the spec commit SHA in the implementation PR

---

## Agent Testing Requirements

All agents must have tests covering:
- [ ] Correct context injection for all trigger scenarios
- [ ] Happy path: produces correct action type and parameters
- [ ] Low confidence path: routes to approval correctly
- [ ] Out-of-scope attempt: blocked by MCP server permission check
- [ ] Action logging: AgentAction record created with correct fields
- [ ] Undo: action reversed correctly within the window

---

## Security Considerations

- Agents never receive credentials directly — only access to scoped MCP tools
- Prompt injection mitigations applied to all user-provided input before passing to agents
- Agent outputs validated against expected schema before execution
- All agent actions logged regardless of outcome
- See [Security Standards — AI Agent Security](../docs/standards/security.md#6-ai-agent-security)
