# Command Center

## Purpose
The Command Center is the primary interface for daily operations across all businesses, projects, and AI agents within LifeOS. It provides a unified view of priorities, blockers, decisions, and execution status at any given moment.

## Inputs
- Active project status from `/projects`
- AI agent activity from `/agents`
- Automation run logs from `/automations`
- Business KPIs from `/businesses`
- Pending decisions and blockers from `/projects`
- Workflow execution status from `/workflows`
- GitHub activity from `/github`

## Outputs
- Daily priority list
- Decision queue
- Waiting-on tracker
- High-ROI task recommendations
- Escalation alerts
- Daily and weekly review prompts

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Project status | /projects | Data |
| Agent activity logs | /agents | Data |
| Business KPIs | /businesses | Data |
| Automation logs | /automations | Data |
| GitHub status | /github | Data |
| Dashboard renders | /dashboards | Output |

## Relationships
- **Consumes** status from every module
- **Surfaces** dashboards defined in `/dashboards`
- **Triggers** workflows via `/workflows`
- **Escalates** to appropriate agents via `/agents`

## Structure
```
command-center/
├── README.md           # This file
├── daily/              # Daily command center snapshots
├── weekly/             # Weekly review templates and records
└── monthly/            # Monthly review templates and records
```

## Future Extensions
- Real-time dashboard powered by live API feeds
- AI-generated briefing documents at session start
- Natural language query interface ("What are my blockers today?")
- Mobile-first command center view
- Push notifications for escalations and deadlines
