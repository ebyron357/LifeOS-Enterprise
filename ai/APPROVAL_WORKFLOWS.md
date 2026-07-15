# LifeOS — Approval Workflows

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

Approval Workflows define when agents can execute autonomously and when human review is required before proceeding. The operator is never replaced as the decision maker. Every high-stakes agent action passes through a defined approval gate.

LifeOS is transparent by design: every approval request tells the operator exactly what the agent is about to do and why, what the expected outcome is, and what happens if the operator approves or rejects.

---

## Approval Actions

An operator can respond to any approval request with one of seven actions:

| Action | Meaning | Agent Behavior |
|--------|---------|---------------|
| **Approve** | Proceed as proposed | Agent executes immediately |
| **Reject** | Do not proceed | Agent cancels task; logs rejection reason |
| **Revise** | Proceed with modifications | Operator provides revised instructions; agent re-executes |
| **Delegate** | Reassign to a different agent | Orchestrator routes to specified agent |
| **Pause** | Hold; do not cancel | Task moves to `paused`; awaits resume |
| **Resume** | Continue from paused state | Agent continues from last checkpoint |
| **Escalate** | Escalate to a human outside the system | Operator notified; task paused until external resolution |

---

## Autonomy Levels

Every agent operates at one of four autonomy levels. The level determines what actions require approval.

### Level 1 — Read Only
Agent may read, analyze, and summarize any module data it is authorized to access. No approvals required.

**Examples:** Research Analyst gathering sources, Knowledge Engineer reviewing existing objects.

### Level 2 — Draft and Propose
Agent may create draft outputs (files, plans, recommendations) but must not write to production locations or send external communications without approval.

**Examples:** Documentation Specialist creating a draft SOP, Marketing Strategist drafting a campaign brief.

### Level 3 — Execute with Logging
Agent may execute defined task types autonomously and log results. No pre-execution approval required. Operator reviews post-execution.

**Conditions:** Task type must be in the agent's approved execution set. No irreversible external actions.

**Examples:** Project Manager updating project status, Knowledge Engineer promoting a knowledge object, Engineering Lead commenting on a PR.

### Level 4 — Supervised Execution
Every action requires pre-execution approval. Used for agents with access to irreversible or high-impact systems.

**Examples:** DevOps Engineer deploying to production, Finance Advisor modifying financial records, Security Advisor disclosing a vulnerability.

---

## Approval Required Matrix

| Action Type | Autonomy Level Required | Approval Required? |
|-------------|------------------------|-------------------|
| Read any module data | 1+ | Never |
| Create draft files | 2+ | No |
| Update project metadata (status, next action) | 3 | No |
| Create knowledge objects | 3 | No |
| Merge pull request | 4 | Yes |
| Deploy to production | 4 | Yes |
| Send external communication (Slack, email) | 3 | No (to internal); Yes (to external) |
| Modify financial records | 4 | Yes |
| Create or delete database records | 4 | Yes |
| Make a `Final` decision | N/A | Always — operator only |
| Archive a project or business | 4 | Yes |
| Trigger an automation that affects production | 4 | Yes |
| Disclose a security vulnerability | 4 | Yes |
| Publish content publicly | 3 | No (draft); Yes (publish) |

---

## Approval Request Format

When an agent reaches an approval gate, it surfaces a structured request:

```json
{
  "approval_id": "APR-XXXX",
  "task_id": "TSK-XXXX",
  "agent_id": "devops-engineer",
  "action_type": "deploy_to_production",
  "urgency": "Normal",
  "summary": "Deploy API v2.1.0 to production (clientverse/api)",
  "details": {
    "repository": "clientverse/api",
    "version": "v2.1.0",
    "environment": "production",
    "changes_included": ["GraphQL pagination fix", "Auth token refresh fix"],
    "estimated_downtime": "0 seconds (rolling deploy)"
  },
  "expected_outcome": "Production API updated to v2.1.0 with no service interruption",
  "risks": ["If CI failed silently, production could receive a regression"],
  "ci_status": "passing",
  "rollback_plan": "Revert to v2.0.8 via Vercel dashboard (< 30 seconds)",
  "options": ["Approve", "Reject", "Revise", "Pause"],
  "recommended_action": "Approve",
  "awaiting_since": "2026-07-04T09:00:00Z",
  "expires_at": "2026-07-04T17:00:00Z"
}
```

---

## Approval Expiry

Every approval request has an expiry time. If the operator does not respond:

| Urgency | Expiry | Behavior on Expiry |
|---------|--------|-------------------|
| `Critical` | 2 hours | Escalate to secondary approver or pause |
| `Normal` | 24 hours | Pause task; notify operator again |
| `Low` | 72 hours | Pause task; add to weekly review queue |

Expired approvals are never auto-approved. They always pause.

---

## Approval Chains

Some actions require approval from multiple parties in sequence:

| Action | Approver 1 | Approver 2 |
|--------|-----------|-----------|
| Major architectural change | Engineering Lead review | Operator final |
| Legal document publication | Legal Advisor review | Operator final |
| Financial commitment > $X | Finance Advisor review | Operator final |
| Security disclosure | Security Advisor assessment | Operator final |

Approver 1 is an agent review step. Approver 2 is always the human operator. Agents do not have final approval authority on high-stakes actions.

---

## Autonomous Execution Scope

Agents may execute the following without approval:

| Agent | Autonomous Actions |
|-------|--------------------|
| Chief of Staff | Assemble daily briefing, route tasks, summarize reviews |
| Project Manager | Update project status, flag blockers, propose next actions |
| Engineering Lead | Comment on PRs, create issues, write draft specs |
| Knowledge Engineer | Create/update knowledge objects, update index |
| Research Analyst | Conduct research, produce drafts |
| Automation Architect | Design automation specs, diagnose failures |
| Marketing Strategist | Draft content, create campaign briefs |
| Sales Strategist | Analyze pipeline, draft outreach templates |
| Finance Advisor | Analyze KPIs, produce financial summaries |
| Legal Advisor | Review documents, produce risk assessments |
| UI/UX Designer | Create wireframes, design specs |
| QA Engineer | Write test plans, document bug reports |
| DevOps Engineer | Monitor deployments, diagnose failures |
| Security Advisor | Review code, produce vulnerability reports |
| Documentation Specialist | Create and update documentation drafts |

**All agents require approval for:** Production deployments, external communications, financial transactions, irreversible deletions, and making Final decisions.

---

## Approval Audit Log

Every approval event is logged:

```
YYYY-MM-DDTHH:MM:SSZ | APR-XXXX | action_type | agent_id | outcome | operator | note
```

Example:
```
2026-07-04T09:15:00Z | APR-0031 | deploy_to_production | devops-engineer | Approved | operator | "Reviewed CI output. Approved."
2026-07-04T11:30:00Z | APR-0032 | publish_content       | marketing-strategist | Revised  | operator | "Adjust headline tone before publishing"
```

---

## Future Extensions

- **Mobile approvals** — Approve/reject via Slack or mobile push notification
- **Approval delegation** — Operator designates a delegate approver for a defined period
- **Approval SLA tracking** — Alert when approvals are pending too long
- **Automated pre-approval** — Operator pre-approves a class of actions for a defined time window
- **Multi-operator approval** — Require consensus approval from multiple operators on critical actions
