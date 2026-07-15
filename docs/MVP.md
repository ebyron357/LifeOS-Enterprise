# LifeOS — MVP Definition

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## MVP Philosophy

The LifeOS MVP is not a feature-complete product. It is the **smallest version of LifeOS that delivers real, sustained value to a multi-business operator managing their work every day.**

The MVP must answer yes to one question: **"Can an operator replace their current scattered setup with LifeOS and run their business better?"**

If yes, it ships. If no, it waits.

The MVP is repository-first (file-based Markdown + JSON schemas). It does not require a web application, a database, or a deployment pipeline. It runs in any environment that can read and write files, and it integrates through the MCP protocol.

---

## Guiding Constraints for MVP

1. **No application code.** The MVP is an architecture, a schema system, and a documentation standard — not a web app.
2. **One source of truth.** Every data object lives in exactly one place. No duplication.
3. **Schema-validated from day one.** Every object must conform to its JSON schema.
4. **AI-operational from day one.** At least the Chief of Staff and Project Manager agents must be functional.
5. **Three MCP connectors minimum.** GitHub, Slack, and Claude (or OpenAI) must be operational.
6. **Template-complete.** Every supported object type must have a usable template.

---

## Feature Categorization

### Must Have — Core Foundation

*These features are required for LifeOS to deliver any value. Without them, the MVP does not exist.*

| Feature | Module | Justification |
|---------|--------|---------------|
| JSON schemas for all 14 core objects | Schemas | Without schemas there is no data integrity, no AI consumption, no validation |
| Business template (all 15 sub-modules) | Business OS | The primary unit of organization; without it, nothing is organized |
| Project template with all required fields | Project OS | The primary unit of execution; every initiative needs this |
| Knowledge object template + index | Knowledge Engine | Institutional memory begins here; delay compounds |
| Chief of Staff agent (full configuration) | AI Workspace | The daily briefing and orchestration agent; core daily value |
| Project Manager agent (full configuration) | AI Workspace | Project health is the most common pain; this agent solves it |
| Command Center daily template | Command Center | Without a daily briefing, LifeOS has no front door |
| Weekly review template | Command Center | The weekly review is the minimum viable cadence for system maintenance |
| GitHub MCP connector | MCP Hub | Technical operators need this; non-technical operators need to know it's here |
| Claude or OpenAI MCP connector | MCP Hub | Without a model connector, agents cannot operate |
| Decision template | Decision Center | Decisions logged from day one; retroactive capture is unreliable |
| Risk template | Project OS | Risk management without templates gets skipped |
| NAMING_CONVENTIONS.md | Documentation | Without naming conventions, the system diverges from day one |
| METADATA_SCHEMA.md | Documentation | Reference for all schema field definitions |
| REPOSITORY_GUIDE.md | Documentation | New operators must be able to onboard without assistance |
| docs/AUDIT_REPORT.md | Documentation | Establishes the baseline for all future improvements |

---

### Should Have — Operational Completeness

*These features significantly improve the operator experience and should ship in the first major iteration after core MVP.*

| Feature | Module | Justification |
|---------|--------|---------------|
| Slack MCP connector | MCP Hub | Most operators' primary communication channel; adds immediate automation value |
| Monthly review template | Command Center | Needed for the monthly cadence; weekly alone is insufficient |
| All 10 AI agents configured | AI Workspace | Chief of Staff + PM alone covers 70% of daily needs; others cover the rest |
| Finance Hub templates (budget, expense, financial review) | Finance Hub | Financial visibility is a top operator need |
| CRM templates (contact, company, deal) | CRM | Sales pipeline is critical for revenue-generating businesses |
| SOP template + platform SOPs | SOPs | Processes not documented will be inconsistently executed |
| Automation templates | Automation Studio | Without templates, automations are not created; time savings delayed |
| Knowledge domain structure (6 domains) | Knowledge Engine | Unorganized knowledge is marginally better than no knowledge |
| Dashboard specifications (13 dashboards) | Dashboard Engine | Visual layer is essential for non-technical operators |
| NotebookLM MCP connector | MCP Hub | Document intelligence is a high-value early differentiator |
| Google Drive MCP connector | MCP Hub | Most operators store documents here |
| Business strategy + vision templates | Business OS | Operators need structure for strategic thinking |
| People template | People module | Capacity planning and ownership tracking start here |
| Repository template | Repository Manager | GitHub-connected teams need this immediately |

---

### Could Have — Power Features

*These features add leverage for power users but are not required to deliver core value.*

| Feature | Module | Justification |
|---------|--------|---------------|
| Figma MCP connector | MCP Hub | Design teams only; narrower audience |
| Stripe MCP connector | MCP Hub | Revenue-stage businesses only; most MVP users are earlier |
| Supabase MCP connector | MCP Hub | Technical teams only |
| Vercel MCP connector | MCP Hub | Technical teams only |
| Discord MCP connector | MCP Hub | Fewer business-critical use cases than Slack |
| Cloudflare MCP connector | MCP Hub | DevOps use case only |
| n8n MCP connector | MCP Hub | Power automation users; most start with Zapier |
| Opportunity schema + template | Decision Center | Useful but not blocking execution |
| Learning System templates | Learning System | High value but lower urgency than execution systems |
| Agent Marketplace | AI Workspace | Future phase; requires platform stability first |
| Health System framework | Health | Visibility without action is low value early on |
| Cross-business portfolio dashboard | Dashboard Engine | Single-business operators (early majority) don't need this |
| Meeting templates with full schema | Knowledge Engine | Useful, but most operators already have a meeting system |

---

### Future Vision — Platform Scale

*These features define the SaaS product but require a web application layer.*

| Feature | Module | Justification |
|---------|--------|---------------|
| Web application UI | Platform | File-based system is the MVP; web UI is Phase 3+ |
| Multi-user collaboration | Platform | Multiple users require auth, permissions, and conflict resolution |
| Real-time dashboards | Dashboard Engine | Requires database and live data layer |
| Agent performance optimization | AI Workspace | Requires historical data to optimize |
| Agent Marketplace (publisher side) | AI Workspace | Requires platform, SDK, and revenue model |
| Knowledge graph visualization | Knowledge Engine | Requires frontend rendering layer |
| Automated knowledge extraction | Knowledge Engine | Requires document processing pipeline |
| Financial forecasting | Finance Hub | Requires historical data and ML layer |
| API for external consumption | Platform | Requires versioned API design and developer documentation |
| White-label enterprise offering | Platform | Requires multi-tenancy architecture |
| Mobile application | Platform | Requires native app development |

---

## MVP Scope Summary

| Category | Features Included | Notes |
|----------|------------------|-------|
| Must Have | 16 | All ship in v1 |
| Should Have | 14 | Ship in first 4 weeks post-v1 |
| Could Have | 13 | Ship over next 3 months |
| Future Vision | 11 | Require web app layer |

---

## MVP Success Criteria

The MVP is successful when a single operator can:

1. ✅ Create a business in LifeOS in under 30 minutes using templates
2. ✅ Create a project with all required fields in under 15 minutes
3. ✅ Receive a daily briefing from the Chief of Staff agent
4. ✅ Connect at least two MCP tools (GitHub + Claude/OpenAI)
5. ✅ Complete a full weekly review using the template
6. ✅ Capture 3 knowledge objects from a week of work
7. ✅ Run a complete daily workflow: briefing → execute → update → close
8. ✅ Onboard without help (documentation alone is sufficient)

---

## What the MVP Is NOT

- Not a web application
- Not a mobile app
- Not a real-time collaboration tool
- Not an accounting system
- Not a CRM replacement
- Not a code editor
- Not a deployment platform

The MVP is an **AI-augmented operating system for a single operator** running their businesses, projects, and knowledge from a structured file-based repository.

Everything else is a future phase.

---

*This MVP definition should be reviewed at the completion of each release phase. Features move between categories as the platform matures.*
