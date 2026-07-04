# GitHub

## Purpose
The GitHub module manages all code repositories, issues, pull requests, actions, and developer workflows connected to LifeOS businesses and projects. It serves as the integration point between LifeOS's project management layer and the actual code execution environment.

## Inputs
- Repository creation requests from `/projects`
- MCP GitHub connector payloads from `/mcp`
- CI/CD status webhooks
- Issue and PR updates
- Commit and release events
- Agent code review requests from `/agents`

## Outputs
- Repository health reports
- CI/CD status summaries
- Issue and PR dashboards
- Automated project status updates (linked repos → linked projects)
- Code review summaries from AI agents
- GitHub Actions workflow results

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| MCP/GitHub connector | /mcp | Integration |
| Projects | /projects | Linked context |
| Agents | /agents | Code review, automation |
| Automations | /automations | CI/CD triggers |
| Dashboards | /dashboards | Repository health view |

## Relationships
- GitHub repositories are **linked to** projects in `/projects`
- GitHub events **trigger** workflows in `/workflows`
- AI agents **perform code reviews** and report back through this module
- GitHub Actions are **monitored** and surfaced in the Repository Health dashboard

## Structure
```
github/
├── README.md               # This file
├── repositories.md         # Repository registry (links to all repos)
├── actions/                # GitHub Actions workflow templates
│   ├── validate-schema.yml
│   └── ai-review.yml
└── standards/              # GitHub standards and conventions
    ├── branch-naming.md
    ├── commit-conventions.md
    └── pr-template.md
```

## Future Extensions
- Automated repository health scoring
- AI-generated release notes
- Cross-repository dependency tracking
- Automated issue triage via AI agent
- Repository archival and cleanup workflows
