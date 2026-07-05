# MCP Integrations

## Overview

All AI agent tool integrations in LifeOS Enterprise are implemented as Model Context Protocol (MCP) servers. This is the standard established in [ADR-003](../docs/architecture/decisions/ADR-003-mcp-agents.md).

---

## What is MCP?

Model Context Protocol (MCP) is an open standard for connecting AI agents to external tools and data sources. An MCP server exposes a set of typed tools that an AI agent can call. The agent discovers available tools at runtime and calls them as needed.

See the [MCP specification](https://modelcontextprotocol.io) for protocol details.

---

## MCP Server Catalog

### Platform MCP Servers (internal)

| Server ID | Description | Tools |
|-----------|-------------|-------|
| `lifeos-tasks` | Task and project management | `list_tasks`, `get_task`, `create_task`, `update_task`, `complete_task`, `list_projects`, `get_project`, `update_project_next_action` |
| `lifeos-contacts` | Contact management | `list_contacts`, `get_contact`, `create_contact`, `link_contact_to_project` |
| `lifeos-knowledge` | Knowledge graph and notes | `search`, `get_note`, `create_note`, `list_notes`, `get_entity_neighbors`, `get_decisions` |
| `lifeos-agents` | Agent action management | `list_pending_actions`, `approve_action`, `reject_action`, `undo_action` |
| `lifeos-business-units` | Business unit context | `list_business_units`, `get_business_unit` |

### Integration MCP Servers (external)

| Server ID | External Service | Direction | Tools |
|-----------|-----------------|-----------|-------|
| `lifeos-calendar` | Google Calendar / Outlook | Read | `list_events`, `get_event`, `find_availability`, `create_event` |
| `lifeos-slack` | Slack | Read | `list_tagged_messages`, `get_thread` |
| `lifeos-email` | Gmail / Outlook | Read | `list_flagged_emails`, `get_email_thread` |
| `lifeos-github` | GitHub | Read + Write | `list_open_prs`, `get_pr`, `get_issue`, `create_issue` |
| `lifeos-finance` | QuickBooks / Xero | Read | `list_invoices`, `get_invoice_summary`, `list_overdue_invoices` |
| `lifeos-trading` | Trading platforms (TradeIQ) | Read | `get_open_positions`, `get_pnl_summary` |

---

## Tool Schema Convention

Every MCP tool must define:

```typescript
type MCPTool = {
  name: string               // snake_case
  description: string        // what this tool does (shown to LLM)
  inputSchema: JSONSchema    // JSON Schema for tool inputs
  outputSchema: JSONSchema   // JSON Schema for tool outputs
}
```

Tool descriptions must be written for an LLM audience — clear, specific, and including edge cases.

---

## MCP Server Implementation Requirements

Each MCP server must:

1. Implement the MCP protocol specification
2. Handle authentication via injected credentials (never hardcoded)
3. Enforce the scope granted by the agent's configuration (reject out-of-scope calls)
4. Return errors in a structured format (not raw exceptions)
5. Log all tool calls with: tool name, input hash, output hash, agent ID, timestamp
6. Be independently versioned and deployable
7. Be documented in this file with its tool list

---

## Adding a New MCP Server

1. Add the server definition to this catalog
2. Define all tool schemas
3. Create an implementation repository (or add to existing MCP monorepo)
4. Write tests for all tool happy paths and error cases
5. Update the agent catalog in [agents/README.md](../agents/README.md) to reference the new server

---

## MCP Server Security

- Each MCP server validates the requesting agent's scope token before executing any tool
- Integration servers store OAuth tokens encrypted at rest, managed by the platform secrets manager
- MCP servers for external integrations request minimum required OAuth scopes
- All tool calls are logged as part of the AgentAction audit trail
- See [Security Standards](../docs/standards/security.md) for full requirements
