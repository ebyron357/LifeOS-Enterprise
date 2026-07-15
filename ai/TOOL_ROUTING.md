# LifeOS — Tool Routing

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief AI Architect  
> **Last Updated:** 2026-07-04

---

## Overview

Tool Routing defines how agents select and invoke external tools through the MCP connector layer. Every routing decision is rule-based and explainable. Agents do not choose tools arbitrarily — they follow a deterministic capability map that matches task type to the appropriate tool.

---

## Routing Architecture

```
Agent receives task
        │
        ▼
1. Identify tool_category from task_type
        │
        ▼
2. Look up tool_category → tool mapping
        │
        ▼
3. Check tool availability (status: active)
        │
        ▼
4. Check agent authorization for tool
        │
        ▼
5. Invoke tool via MCP connector
        │
        ▼
6. Log invocation and result
```

---

## Tool Catalog

| Tool | MCP Connector | Category | Protocol |
|------|--------------|----------|---------|
| GitHub | `/mcp/registry/github.md` | Version Control | REST + GraphQL API |
| NotebookLM | `/mcp/registry/notebooklm.md` | Research | Google API |
| Google Drive | `/mcp/registry/google-drive.md` | Document Storage | Google Drive API |
| Slack | `/mcp/registry/slack.md` | Communication | Slack API |
| Figma | `/mcp/registry/figma.md` | Design | Figma REST API |
| Supabase | `/mcp/registry/supabase.md` | Database | Supabase REST + JS |
| Vercel | `/mcp/registry/vercel.md` | Deployment | Vercel REST API |
| Stripe | `/mcp/registry/stripe.md` | Payments | Stripe API |
| Obsidian | `/mcp/registry/obsidian.md` | Knowledge / Notes | Local API |
| Cursor | `/mcp/registry/cursor.md` | Code Editor | Extension API |
| VS Code | `/mcp/registry/vscode.md` | Code Editor | Extension API |
| OpenAI | `/mcp/registry/openai.md` | AI Model | OpenAI API |
| Claude | `/mcp/registry/claude.md` | AI Model | Anthropic API |
| Gemini | `/mcp/registry/gemini.md` | AI Model | Google AI API |
| n8n | `/mcp/registry/n8n.md` | Automation | n8n REST API |

---

## Task → Tool Routing Rules

### Code Review and Development
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Code review | GitHub | VS Code | PRs and inline comments live on GitHub |
| Code generation | Cursor | VS Code | Cursor is optimized for AI-assisted generation |
| Architecture review | GitHub | — | Architecture docs live in repositories |
| Dependency audit | GitHub | — | Package files are in the repository |

**Routing rule:** Any task with `task_type` in `{code_review, code_generation, debugging, architecture_review}` routes to GitHub first.

---

### Research and Knowledge
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Deep document analysis | NotebookLM | Google Drive | NotebookLM is purpose-built for document Q&A |
| Source document retrieval | Google Drive | — | Source files live in Drive |
| Knowledge capture | Obsidian | — | Local knowledge base for Obsidian users |
| Web research | Claude / OpenAI | — | Model web search capabilities |

**Routing rule:** Tasks with `task_type: research` route to NotebookLM when documents are available; fallback to model web search.

---

### Communication and Notifications
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Team notification | Slack | — | Primary async communication channel |
| Operator alert | Slack | — | Real-time alert delivery |
| Meeting summary distribution | Slack | Google Drive | Summary sent via Slack; doc saved to Drive |

**Routing rule:** All notifications route to Slack unless an alternative communication tool is configured.

---

### Design
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| UI wireframes | Figma | — | Figma is the canonical design tool |
| Design review | Figma | — | Comments and approvals live in Figma |
| Design system access | Figma | — | Component library lives in Figma |

**Routing rule:** All design tasks route exclusively to Figma.

---

### Database and Backend
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Schema review | Supabase | GitHub | Live schema in Supabase; migrations in GitHub |
| Query optimization | Supabase | — | Query execution happens in Supabase |
| Data analysis | Supabase | — | Direct database access for analysis |

**Routing rule:** Data tasks route to Supabase. Infrastructure tasks route to Vercel or GitHub.

---

### Deployment and Infrastructure
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Deploy management | Vercel | GitHub | Vercel manages deployments; GitHub holds code |
| CI/CD configuration | GitHub | Vercel | GitHub Actions + Vercel integration |
| Deployment health check | Vercel | — | Deployment status lives in Vercel |

**Routing rule:** Deployment tasks route to Vercel. CI/CD changes route to GitHub.

---

### Financial
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Payment data | Stripe | — | Stripe is the canonical payments source |
| Revenue analysis | Stripe | — | Revenue data lives in Stripe |
| Subscription management | Stripe | — | Customer billing lives in Stripe |

**Routing rule:** All financial tasks involving payments or subscriptions route to Stripe.

---

### Automation
| Task | Primary Tool | Secondary Tool | Reason |
|------|-------------|---------------|--------|
| Workflow automation | n8n | — | n8n is the primary automation platform |
| Trigger configuration | n8n | GitHub Actions | n8n for cross-app; GitHub Actions for code |
| Automation monitoring | n8n | — | Run history lives in n8n |

**Routing rule:** Cross-application automations route to n8n. Code-related automations route to GitHub Actions.

---

### AI Models
| Task | Model | Routing Reason |
|------|-------|---------------|
| Complex reasoning, long context | Claude (claude-3-opus / claude-3-5-sonnet) | Best for nuanced analysis |
| Code generation, function calling | OpenAI (gpt-4o) | Strong code + structured output |
| Research, document summarization | Gemini Pro | Strong at long-document processing |
| Fast, cost-efficient tasks | Claude Haiku / GPT-4o-mini | Speed and cost optimization |

**Model routing rule:** Routed by task_type + context_length + cost_tier. The Orchestrator selects the model; agents do not specify their own model unless explicitly configured.

---

## Tool Authorization Matrix

| Agent | GitHub | Slack | Supabase | Vercel | Stripe | Figma | NotebookLM |
|-------|--------|-------|---------|--------|--------|-------|-----------|
| Chief of Staff | Read | Write | — | Read | Read | — | Read |
| Project Manager | Read | Write | — | — | — | — | — |
| Engineering Lead | **Write** | Write | Read | Read | — | Read | Read |
| Knowledge Engineer | Read | — | — | — | — | — | **Write** |
| Research Analyst | Read | — | — | — | — | — | **Write** |
| Automation Architect | **Write** | Write | Read | Read | — | — | — |
| Marketing Strategist | Read | Write | — | — | — | Read | Read |
| Sales Strategist | Read | Write | — | — | Read | — | Read |
| Finance Advisor | — | — | Read | — | **Write** | — | Read |
| Legal Advisor | Read | — | — | — | — | — | Read |
| UI/UX Designer | Read | — | — | — | — | **Write** | — |
| QA Engineer | **Write** | Write | Read | — | — | — | — |
| DevOps Engineer | **Write** | Write | Read | **Write** | — | — | — |
| Security Advisor | Read | Write | Read | Read | — | — | — |
| Documentation Specialist | **Write** | — | — | — | — | Read | Read |

**Write** = create, update, delete operations  
**Read** = read-only access  
**—** = no access

---

## Routing Explainability

Every tool invocation is logged with the routing reason:

```json
{
  "task_id": "TSK-0042",
  "agent_id": "engineering",
  "tool": "github",
  "action": "create_pr_comment",
  "routing_reason": "task_type:code_review matches routing rule: code_review → GitHub (primary)",
  "authorization": "engineering:github:write",
  "invoked_at": "2026-07-04T09:03:14Z",
  "result_status": "success"
}
```

---

## Fallback Rules

If the primary tool is unavailable:
1. Check secondary tool (if defined)
2. If secondary unavailable: pause task and escalate to operator
3. Log tool unavailability in the Automation Status dashboard

---

## Future Extensions

- **Dynamic tool discovery** — New MCP connectors automatically appear in the routing table when registered
- **Cost-aware routing** — Prefer cheaper tools when equivalent capability exists
- **Tool health monitoring** — Route around degraded tools automatically
- **Operator-configurable overrides** — Operator can override routing rules per agent or task type
- **Community tool connectors** — Third-party tools registered via the Agent Marketplace
