# Businesses

## Purpose
The Businesses module contains independent operating systems for each business managed within LifeOS. Each business is fully self-contained — with its own vision, strategy, projects, finances, people, SOPs, and AI configuration — while sharing cross-cutting services from the LifeOS platform.

## Inputs
- Business creation requests with name and initial configuration
- Strategy and vision documents from business owners
- Financial data feeds (manual or via MCP connectors)
- Project requests routed from `/projects`
- People and role assignments from `/people`

## Outputs
- Business-level dashboards
- Business KPI reports
- Cross-business project portfolio views
- Business-level AI agent configurations
- Business financial summaries

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Project system | /projects | Shared service |
| Knowledge engine | /knowledge | Shared service |
| AI agents | /agents | Shared service |
| Finance templates | /finance | Shared service |
| People registry | /people | Shared service |
| MCP connectors | /mcp | Shared service |
| SOPs | /sops | Shared service |

## Relationships
- Each business is a **consumer** of all platform modules
- Businesses are **isolated** from each other by default
- Cross-business insights are surfaced via the Command Center
- Business-level agents are specialized from base agent templates in `/agents`

## Structure
```
businesses/
├── README.md               # This file
├── _templates/             # Reusable business scaffold
│   └── business/
│       ├── README.md
│       ├── vision/
│       ├── strategy/
│       ├── projects/
│       ├── marketing/
│       ├── sales/
│       ├── operations/
│       ├── finance/
│       ├── meetings/
│       ├── sops/
│       ├── ai/
│       ├── github/
│       ├── risks/
│       ├── kpis/
│       ├── automation/
│       └── knowledge/
└── [business-name]/        # One folder per active business
```

## Future Extensions
- Business health score algorithm
- Cross-business resource allocation optimizer
- Automated competitive analysis pipeline
- Business-level AI briefing agent
- Multi-currency financial consolidation
