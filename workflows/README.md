# Workflows

## Purpose
The Workflows module defines and stores all automation logic, process chains, and orchestration recipes within LifeOS. A workflow is a sequence of steps that can be triggered automatically or manually, connecting agents, tools, data sources, and outputs into repeatable processes.

## Inputs
- Trigger events from `/automations`, `/projects`, `/command-center`
- Agent task completions from `/agents`
- Scheduled triggers (time-based)
- Webhook payloads from external systems via `/mcp`
- Manual execution requests

## Outputs
- Workflow execution logs
- Trigger outputs delivered to target modules
- Status updates to `/dashboards`
- Error alerts and escalations
- n8n / Zapier compatible workflow definitions

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| MCP connectors | /mcp | Tool execution |
| AI agents | /agents | Step executors |
| Automations | /automations | Trigger source |
| Projects | /projects | Context and output target |
| Businesses | /businesses | Scoping |

## Relationships
- Workflows **orchestrate** agents, MCP connectors, and data pipelines
- Workflows are **triggered by** automations, events, and schedules
- Workflows **update** projects, businesses, and knowledge objects
- Workflows are **compatible with** n8n and Zapier for no-code execution

## Structure
```
workflows/
├── README.md               # This file
├── _templates/
│   └── workflow.md         # Workflow definition template
├── business/               # Business-level workflow recipes
├── project/                # Project-level workflow recipes
├── agent/                  # Agent-orchestration workflows
├── knowledge/              # Knowledge ingestion workflows
└── reporting/              # Report generation workflows
```

## Future Extensions
- Visual workflow builder integration
- Workflow version control and rollback
- Conditional branching based on AI decisions
- Real-time workflow monitoring dashboard
- Workflow marketplace for sharing reusable recipes
