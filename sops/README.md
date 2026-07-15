# SOPs

## Purpose
The SOPs (Standard Operating Procedures) module is the institutional memory layer for repeatable processes. Every operation that is performed more than once should be documented here as a reusable, versioned procedure. SOPs reduce onboarding friction, ensure quality consistency, and enable AI agents to execute processes reliably.

## Inputs
- Process documentation from operators and business owners
- Workflow definitions from `/workflows`
- AI-generated process documentation from task retrospectives
- Meeting outputs where new processes are defined
- Regulatory and compliance requirements

## Outputs
- Versioned SOP documents
- SOP usage logs (tracking when and how each SOP is used)
- AI-readable procedure formats for agent execution
- SOP index per business
- Training materials derived from SOPs

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Businesses | /businesses | Owner context |
| Workflows | /workflows | Execution layer |
| Knowledge | /knowledge | Source and output |
| Agents | /agents | Consumer (AI execution) |
| People | /people | Role assignments in procedures |

## Relationships
- SOPs are **owned by** businesses or the platform
- SOPs are **executed by** AI agents via structured workflow steps
- SOPs **feed** the knowledge engine with validated process knowledge
- SOPs are **versioned** to track changes over time

## Structure
```
sops/
├── README.md               # This file
├── _templates/
│   └── sop.md              # Standard SOP document template
├── platform/               # Platform-wide SOPs
│   ├── onboarding.md
│   ├── project-kickoff.md
│   └── weekly-review.md
└── [business-name]/        # Business-specific SOPs
```

## Future Extensions
- SOP compliance checking via AI agent
- SOP effectiveness scoring based on outcome data
- Video SOP generation from text procedures
- Automated SOP update suggestions when workflows change
- SOP translation for international operations
