# System Context

## External Actors

| Actor | Description | Interaction |
|-------|-------------|-------------|
| Operator | Primary user running multiple businesses | Full platform access via web/mobile/CLI |
| Business Unit Lead | Manages single business or function | Scoped access to their business unit |
| Team Member | Contributor within a defined business | Task-scoped access; AI-assisted context |
| AI Agent | Automated agent acting on behalf of a user | API-level access with defined scope and audit log |
| External Service | Third-party tools (CRM, finance, calendar, etc.) | Integration via MCP or webhook |
| MCP Server | Model Context Protocol server | Provides structured tools to AI agents |

---

## System Boundary

LifeOS Enterprise owns:
- Task and project management state
- Knowledge base and document storage
- Contact and relationship records
- Agent definitions, scopes, and execution logs
- Workflow and automation definitions
- Business-unit-scoped configurations

LifeOS Enterprise does **not** own:
- Source of truth for financial transactions (defers to accounting systems)
- Trading execution or order management (defers to trading platforms)
- Email/calendar data (syncs read-only)
- Code repositories (references via integration)

---

## Integration Points

```
LifeOS Enterprise Platform
        │
        ├── Calendar Systems (Google Calendar, Outlook)
        │     Read: scheduled events, availability
        │     Write: create meetings from task context
        │
        ├── Communication (Slack, Email)
        │     Read: mentions, threads tagged to projects
        │     Write: notifications, summaries, digests
        │
        ├── Finance (QuickBooks, Xero, banking APIs)
        │     Read: income, expense categorization
        │     Write: invoices (via defined approval workflow)
        │
        ├── Trading (TradeIQ-specific)
        │     Read: positions, P&L summaries
        │     Write: none (read-only integration)
        │
        ├── Document Storage (Notion, Google Drive, S3)
        │     Read/Write: document sync and linking
        │
        ├── AI Models (OpenAI, Anthropic, local models)
        │     Agents consume model APIs via MCP servers
        │
        └── Code Repositories (GitHub)
              Read: PR status, commit references
              Write: create issues from tasks
```

---

## Data Flows

See [data-flow.md](data-flow.md) for detailed sequence diagrams.

---

## Deployment Contexts

| Context | Description |
|---------|-------------|
| Cloud SaaS | Multi-tenant hosted platform (Phase 7) |
| Self-hosted | Single-tenant deployment on operator infrastructure |
| Local-first | Offline-capable desktop/mobile with sync |

Implementation repositories must declare which deployment contexts they support.
