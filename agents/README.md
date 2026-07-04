# Agents

## Purpose
The Agents module is the registry and configuration store for all AI agents operating within LifeOS. Each agent is a specialized AI worker with a defined purpose, tool access, memory configuration, and escalation rules. Agents are the primary execution force within the platform — they read, reason, write, and act on behalf of the operator.

## Inputs
- Task assignments from `/command-center` and `/projects`
- Knowledge context from `/knowledge`
- Tool access via MCP connectors in `/mcp`
- System prompts and memory from `/ai`
- Workflow triggers from `/workflows`

## Outputs
- Task completions delivered to requesting modules
- Knowledge objects written to `/knowledge`
- Project updates written to `/projects`
- Escalation alerts to operator or other agents
- Agent activity logs for `/dashboards`

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| AI layer | /ai | Model and memory config |
| MCP connectors | /mcp | Tool access |
| Knowledge engine | /knowledge | Context |
| Projects | /projects | Task source |
| Workflows | /workflows | Trigger system |

## Relationships
- Agents are **configured by** `/ai`
- Agents are **triggered by** `/workflows` and `/command-center`
- Agents **write back to** `/knowledge`, `/projects`, and `/businesses`
- Agents **escalate to** each other or to a human operator
- The Chief of Staff agent is the **orchestrator** of all other agents

## Structure
```
agents/
├── README.md               # This file
├── _templates/
│   └── agent.md            # Base agent configuration template
├── chief-of-staff/
├── project-manager/
├── research/
├── engineering/
├── design/
├── marketing/
├── sales/
├── automation/
├── legal/
├── finance/
└── knowledge/
```

## Future Extensions
- Agent performance scoring and improvement feedback loops
- Agent spawning (one agent creates a sub-agent for a task)
- Agent marketplace for third-party specialist agents
- Agent collaboration protocol (multi-agent task decomposition)
- Human-in-the-loop approval gates for high-stakes actions
- Agent audit trail for compliance
