# Dashboards

## Purpose
The Dashboards module contains design specifications, data source mappings, and layout definitions for all LifeOS visibility surfaces. Dashboards are the lens through which operators see the state of their businesses, projects, agents, and automations at any moment.

## Inputs
- Live data from all platform modules (projects, businesses, agents, automations, github, knowledge)
- KPI definitions from `/businesses`
- Workflow execution logs from `/workflows`
- Agent activity from `/agents`
- MCP health status from `/mcp`

## Outputs
- Daily Command Center view
- Weekly and monthly review prompts
- Business and project portfolio views
- AI activity summaries
- Automation and workflow status
- Knowledge growth metrics
- GitHub and repository health
- Decision queues and waiting-on lists

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| All platform modules | * | Data sources |
| Command Center | /command-center | Primary consumer |
| Businesses | /businesses | KPI source |
| Projects | /projects | Status source |

## Relationships
- Dashboards **consume** data from every module
- Dashboards are **rendered** through the Command Center
- Dashboard data feeds are **defined** alongside each dashboard spec
- Dashboards **drive** decision-making without replacing it

## Structure
```
dashboards/
├── README.md                       # This file
├── daily-command-center.md
├── weekly-review.md
├── monthly-review.md
├── business-overview.md
├── project-portfolio.md
├── ai-activity.md
├── automation-status.md
├── knowledge-growth.md
├── github-overview.md
├── repository-health.md
├── decision-queue.md
├── waiting-on.md
└── high-roi-tasks.md
```

## Future Extensions
- Live-rendered dashboards via web application
- Customizable dashboard layouts per operator
- AI-generated insights overlaid on dashboards
- Threshold alerting with push notifications
- Dashboard export to PDF for business reviews
