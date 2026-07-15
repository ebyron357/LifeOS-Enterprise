# MCP

## Purpose
The MCP (Model Context Protocol) module is the integration hub for LifeOS. It manages all external service connectors, authentication credentials, capability registries, and health monitoring for every tool and platform that LifeOS interacts with. MCP connectors are the bridges between LifeOS and the outside world.

## Inputs
- Connector configuration requests
- Authentication tokens and credentials (stored securely, never in plain text)
- Health check triggers
- Workflow execution requests that require external tool calls
- Agent requests for external data or actions

## Outputs
- Authenticated API calls to external services
- Connector health status reports
- Capability manifests per connector
- Error logs and retry queues
- Connector activity metrics for `/dashboards`

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Workflows | /workflows | Consumer |
| Agents | /agents | Consumer |
| Automations | /automations | Consumer |
| Dashboards | /dashboards | Status reporter |

## Relationships
- MCP is a **shared service** consumed by agents, workflows, and automations
- MCP connectors **enable** all external integrations across the platform
- MCP health status is **reported** to the Automation Status dashboard
- Credentials are **managed** through environment variables or a secrets manager, never committed to the repository

## Structure
```
mcp/
├── README.md               # This file
├── registry/               # One file per connector
│   ├── github.md
│   ├── obsidian.md
│   ├── notebooklm.md
│   ├── google-drive.md
│   ├── google-docs.md
│   ├── slack.md
│   ├── discord.md
│   ├── shopify.md
│   ├── supabase.md
│   ├── vercel.md
│   ├── cloudflare.md
│   ├── stripe.md
│   ├── figma.md
│   ├── openai.md
│   ├── claude.md
│   ├── gemini.md
│   ├── cursor.md
│   ├── vscode.md
│   ├── n8n.md
│   └── zapier.md
└── _templates/
    └── connector.md        # Connector definition template
```

## Future Extensions
- Automated connector health monitoring with alerting
- OAuth flow management for user-level connectors
- Connector capability auto-discovery via API introspection
- Rate limit tracking and intelligent throttling
- Connector version management and deprecation warnings
