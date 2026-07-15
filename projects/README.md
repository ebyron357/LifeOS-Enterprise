# Projects

## Purpose
The Projects module is the universal project management layer for LifeOS. Every initiative — regardless of business or domain — is tracked here with a consistent schema. Projects serve as the primary unit of execution, linking strategy to deliverables, people, AI agents, and automations.

## Inputs
- Project creation requests (manual or AI-generated)
- Business strategy objectives from `/businesses`
- Resource availability from `/people` and `/resources`
- GitHub repository links from `/github`
- AI agent assignments from `/agents`
- MCP connection requirements from `/mcp`

## Outputs
- Active project registry
- Next-action lists per project
- Dependency maps
- Risk registers
- Decision logs
- Deliverable tracking
- Project status reports for `/command-center`

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Business context | /businesses | Parent |
| People/owners | /people | Reference |
| GitHub repos | /github | Integration |
| AI agents | /agents | Assignment |
| MCP connections | /mcp | Integration |
| Automations | /automations | Trigger |
| Knowledge objects | /knowledge | Link |

## Relationships
- Projects **belong to** a business or are platform-level
- Projects **own** decisions, risks, deliverables, and documentation
- Projects **reference** GitHub repositories and MCP connections
- Projects **drive** workflow executions in `/workflows`

## Structure
```
projects/
├── README.md               # This file
├── _templates/
│   ├── project.md          # Full project template
│   ├── risk.md             # Risk log entry template
│   ├── decision.md         # Decision log entry template
│   └── deliverable.md      # Deliverable tracker template
└── [business-name]/        # Projects organized by business
    └── [project-name]/
```

## Required Project Fields
Every project must include:
- `status` — Draft / Active / On Hold / Completed / Cancelled
- `priority` — Critical / High / Medium / Low
- `owner` — Person responsible
- `next_action` — Single immediate next step
- `dependencies` — Blocking projects or tasks
- `github_repo` — Linked repository URL
- `ai_owner` — Assigned AI agent
- `review_date` — Next scheduled review
- `documentation` — Link to docs
- `risks` — Active risk items
- `decisions` — Decision log
- `deliverables` — Output artifacts
- `automation` — Linked automations
- `mcp_connections` — Active MCP integrations

## Future Extensions
- Automated project health scoring
- AI-generated next-action suggestions
- Cross-project dependency visualization
- GitHub issue/PR sync via MCP
- Automated progress reporting to business dashboards
