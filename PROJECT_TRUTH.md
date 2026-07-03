# LifeOS Enterprise — Project Truth

> This document is the **single source of truth** for all canonical project decisions, constraints, and definitions. When in doubt, defer to this document.

---

## What This Document Is

PROJECT_TRUTH.md captures decisions that are **settled and authoritative**. It is not a discussion space. It is not aspirational. Every statement here is a firm commitment that all other documentation, templates, and implementation must honor.

When a decision changes, this document must be updated first.

---

## Core Identity

| Property | Value |
|----------|-------|
| **Project Name** | LifeOS Enterprise |
| **Repository** | ebyron357/LifeOS-Enterprise |
| **Type** | Personal Operating System |
| **Primary Platform** | Obsidian |
| **Note Format** | Markdown + YAML frontmatter |
| **License** | MIT |

---

## Mission Statement

LifeOS Enterprise exists to eliminate friction between intention and execution across all life domains — by providing a structured, automated, AI-assisted system that captures, organizes, surfaces, and reviews everything that matters.

---

## Canonical Decisions

### Decision 1: Markdown-Only Notes
All notes are plain Markdown files. No proprietary Obsidian-specific syntax that cannot be parsed by a standard Markdown renderer is permitted in core content. YAML frontmatter is the only structured data format used inside note files.

**Rationale:** Portability, longevity, and tooling flexibility.

---

### Decision 2: YAML Frontmatter for Structured Data
All queryable, relational, or typed data is stored in YAML frontmatter. Inline dataview fields (`key:: value`) are not used in new templates.

**Rationale:** YAML frontmatter is parseable by any YAML library. Inline Dataview fields are a plugin-specific format.

---

### Decision 3: Typed Note Architecture
Every note in the vault has an explicit `type` frontmatter property. The set of valid types is defined in [docs/OBJECT_MODEL.md](./docs/OBJECT_MODEL.md) and is the exhaustive list.

**Rationale:** Type-safety enables reliable Dataview queries and automation.

---

### Decision 4: No Redundant Storage
A piece of information has exactly one home. If it appears in multiple places, exactly one location is canonical and the others are views or references.

**Rationale:** Avoids drift and maintenance overhead.

---

### Decision 5: Git as Version Control
This repository is the version-controlled home for all specifications, templates, scripts, and configuration. The vault itself may be synced separately, but all changes to system design flow through this repository.

**Rationale:** Auditability, collaboration, and rollback capability.

---

### Decision 6: Plugin Minimalism
Plugins are added only when the capability they provide is essential to the system and cannot be reasonably achieved without them. Every plugin is documented in [docs/PLUGIN_STACK.md](./docs/PLUGIN_STACK.md) with an explicit justification.

**Rationale:** Reduces fragility and dependency on third-party maintainers.

---

### Decision 7: Review System is Non-Optional
Every major domain participates in a formal review cadence. The review system is not optional overhead — it is what separates a living system from an archive.

**Rationale:** A system that is not reviewed decays into noise.

---

### Decision 8: AI is a Layer, Not the Foundation
AI capabilities are integrated as a higher-order layer that enhances the system. The vault must be fully functional without any AI integration. AI augments; it does not replace structure.

**Rationale:** Resilience, privacy, and portability.

---

### Decision 9: LifeOS is a Multi-System Enterprise Architecture
LifeOS Enterprise is organized into interacting operating systems: Executive OS, Business OS, Project OS, Knowledge OS, Learning OS, AI OS, Automation OS, Dashboard Architecture, and Plugin Architecture. Their boundaries and interaction model are defined in [ARCHITECTURE.md](./ARCHITECTURE.md) and the corresponding documents in `docs/`.

**Rationale:** Explicit subsystem boundaries reduce architectural drift and make future implementation phases coherent.

---

### Decision 10: Architecture Precedes Implementation
Enterprise architecture must be completed and ratified before implementing Obsidian templates, Dataview queries, plugin configuration, or automation wiring. During the architecture phase, documentation defines the blueprint only.

**Rationale:** Prevents premature implementation from hard-coding assumptions before the blueprint is stable.

---

## Definitions

| Term | Definition |
|------|-----------|
| **Note** | A single Markdown file in the vault |
| **Object** | A note with a defined `type` and schema |
| **Area** | A long-term responsibility or life domain (e.g., Health, Finance, Career) |
| **Project** | A bounded effort with a defined outcome and end date |
| **Resource** | Reference material that supports areas and projects |
| **Template** | A pre-structured note scaffold for a specific object type |
| **Dashboard** | A note that aggregates views of other notes via Dataview queries |
| **MOC** | Map of Content — a manually curated index note for a topic or domain |
| **Review** | A structured, periodic assessment of a domain or system component |
| **Frontmatter** | YAML metadata block at the top of a Markdown file |
| **Operating System** | A bounded subsystem with a defined purpose, owned data, and documented interfaces to other subsystems |

---

## Out of Scope

The following are explicitly **not** part of LifeOS Enterprise:

- Team or multi-user collaboration (the system is personal)
- Public publishing workflows (out of scope for this phase)
- Task management replacement for dedicated tools (the system integrates with, not replaces, GTD-class tools unless explicitly decided otherwise)
- Financial accounting (the system tracks financial awareness, not accounting ledgers)
- Implementation of Obsidian templates during the architecture blueprint phase
- Creation of Dataview queries during the architecture blueprint phase
- Plugin configuration during the architecture blueprint phase

---

## TODO

- [ ] Define the sync strategy as a canonical decision
- [ ] Define the AI provider as a canonical decision once evaluated
- [ ] Add architecture decision record (ADR) format and process
