# LifeOS Enterprise — Specification Repository

> **This is the canonical specification repository for LifeOS Enterprise.**
> It defines the product. It is not an application repository.
> All implementation repositories must reference this repository as their source of truth.

---

## What Is LifeOS Enterprise?

LifeOS Enterprise is the central operating system for managing businesses, projects, knowledge, AI agents, automations, and execution. It provides a single source of truth across every business unit, project, and workflow — augmented by AI and powered by automation.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| One source of truth | All data, decisions, and definitions live here |
| Capture once, reuse many times | Information is structured for reuse across contexts |
| Every project has a next action | Nothing sits idle; every initiative has forward momentum |
| AI augments human decision-making | Agents assist, surface, and recommend — humans decide |
| Automation reduces repetitive work | Routine operations are automated away |

---

## Specification Structure

```
docs/
  architecture/        System architecture, context diagrams, ADRs
  product/             Vision, roadmap, PRDs, user stories
  standards/           Engineering, security, API, data, testing standards
  design-system/       Visual language, tokens, components
  schemas/             Data schemas for core entities, APIs, events
  api/                 API specifications and authentication
  release/             Release process and version plans
businesses/            Per-business context and requirements
agents/                AI agent framework and agent definitions
mcp/                   Model Context Protocol integration specs
workflows/             Workflow definitions and automation logic
templates/             Reusable templates (PRDs, ADRs, user stories)
automation/            Automation patterns and trigger definitions
```

---

## Businesses

- **[TradeIQ](businesses/TradeIQ/overview.md)** — Trading intelligence platform
- **[Alternative](businesses/Alternative/overview.md)** — Alternative investment management
- **[ClientVerse](businesses/ClientVerse/overview.md)** — Client relationship and delivery platform

---

## Roadmap

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Foundation](docs/product/prd/PRD-001-foundation.md) | Planning |
| 2 | [Knowledge Graph](docs/product/prd/PRD-002-knowledge-graph.md) | Planning |
| 3 | [AI Agents](docs/product/prd/PRD-003-ai-agents.md) | Planning |
| 4 | [MCP Integrations](docs/product/prd/PRD-004-mcp-integrations.md) | Planning |
| 5 | [Business Modules](docs/product/prd/PRD-005-business-modules.md) | Planning |
| 6 | [Automation](docs/product/prd/PRD-006-automation.md) | Planning |
| 7 | [SaaS Platform](docs/product/prd/PRD-007-saas-platform.md) | Planning |

---

## Key Documents

- [Product Vision](docs/product/vision.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Engineering Standards](docs/standards/engineering.md)
- [Security Requirements](docs/standards/security.md)
- [API Specification](docs/api/overview.md)
- [Design System](docs/design-system/foundations.md)
- [Release Planning](docs/release/release-process.md)

---

## Contributing to This Specification

This repository uses markdown exclusively. All changes to the specification must be made via pull request. No application code, package managers, or runtime dependencies belong here.

See [Engineering Standards](docs/standards/engineering.md) for contribution guidelines.
