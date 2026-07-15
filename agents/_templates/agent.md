---
# Agent Metadata
agent_id: "[agent-id]"
name: "[Agent Name]"
type: "Specialist"         # Orchestrator | Specialist | Analyst | Builder | Reviewer
status: "Draft"            # Draft | Active | Testing | Paused | Deprecated
model: ""                  # e.g. claude-3-opus, gpt-4o, gemini-pro
ai_module: "/ai"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# Agent: [Agent Name]

## Purpose
<!-- One paragraph: what is this agent's job? What problem does it solve? What value does it create? -->

## Inputs
| Input | Source | Format | Required |
|-------|--------|--------|---------|
|  |  |  | Yes/No |

## Outputs
| Output | Destination | Format | Frequency |
|--------|------------|--------|-----------|
|  |  |  | On-demand/Scheduled |

## Tools
<!-- Which MCP connectors and platform capabilities does this agent use? -->
| Tool | Connector | Purpose |
|------|----------|---------|
|  | /mcp/registry/ |  |

## System Prompt
```
[System prompt goes here. Define role, behavior, constraints, tone, and output format.]
```

## Memory Configuration
- **Short-term context:** Last N messages / session history
- **Long-term memory:** Knowledge objects from `/knowledge/[domain]/`
- **Business context:** `/businesses/[name]/ai/`
- **Injected context:** [List any files or objects injected at every session start]

## Workflows
<!-- Which workflows invoke or are orchestrated by this agent? -->
| Workflow | Trigger | Agent Role |
|---------|---------|-----------|
|  |  | Executor/Reviewer/Escalation target |

## Escalation Rules
| Condition | Action | Escalation Target |
|-----------|--------|-----------------|
| Confidence < 0.6 | Pause and request human input | Operator |
| Task exceeds defined scope | Reject and notify | Operator |
| Error after 2 retries | Escalate with full context | [Orchestrator Agent] |

## Performance Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Tasks Completed/Week |  |  |
| Accuracy Rate |  |  |
| Escalation Rate |  |  |
| Avg Task Duration |  |  |

## Revision History
| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial draft |  |
