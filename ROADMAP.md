# LifeOS Enterprise — Roadmap

> Phase-by-phase development plan. Each phase must be fully documented and reviewed before implementation begins.

---

## Guiding Principle

Build the **specification** before the **implementation**. Every phase begins with documentation and design, then proceeds to implementation only when the design is approved and recorded in `PROJECT_TRUTH.md`.

---

## Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | Repository Foundation | 🟡 In Progress | Project scaffolding, documentation structure, governance |
| 1 | Core Vault Architecture | ⬜ Planned | Folder structure, object model, metadata schema |
| 2 | Template System | ⬜ Planned | Note templates for all object types |
| 3 | Dashboard Layer | ⬜ Planned | Dataview dashboards and command center |
| 4 | Automation & Scripting | ⬜ Planned | Templater scripts, external automation |
| 5 | AI Integration | ⬜ Planned | AI OS layer, prompt engineering, synthesis workflows |
| 6 | Review & Governance System | ⬜ Planned | Review cadences, health checks, system governance |
| 7 | Hardening & Optimization | ⬜ Planned | Performance, testing, edge case handling |

---

## Phase 0 — Repository Foundation

**Goal:** Establish this repository as a professional software project with complete documentation scaffolding.

**Deliverables:**
- [x] README.md — Project overview and orientation
- [x] ARCHITECTURE.md — System architecture and principles
- [x] PROJECT_TRUTH.md — Canonical decisions and definitions
- [x] ROADMAP.md — This document
- [x] CHANGELOG.md — Version history
- [x] CONTRIBUTING.md — Contribution guidelines
- [x] LICENSE — MIT license
- [x] `docs/` — Specification placeholders (10 documents)
- [x] `specifications/` — Empty, ready for detailed specs
- [x] `templates/` — Empty, ready for Obsidian templates
- [x] `scripts/` — Empty, ready for automation scripts
- [x] `tests/` — Empty, ready for test suites
- [x] `.github/` — Empty, ready for GitHub Actions

**Exit Criteria:** All deliverables committed. Repository is navigable by a new contributor with no prior context.

---

## Phase 1 — Core Vault Architecture

**Goal:** Define and implement the foundational vault structure that all future phases build upon.

**Deliverables:**
- [ ] Finalize `docs/OBJECT_MODEL.md` — All object types defined
- [ ] Finalize `docs/METADATA_SCHEMA.md` — All frontmatter schemas defined
- [ ] Finalize `docs/FOLDER_STRUCTURE.md` — Complete folder hierarchy
- [ ] Finalize `docs/PLUGIN_STACK.md` — Plugin list with justifications
- [ ] Create the physical vault folder structure
- [ ] Create base `_meta.md` notes for each top-level folder
- [ ] Implement frontmatter linting/validation script

**Exit Criteria:** A new vault can be set up by following the spec. All object types have defined schemas.

---

## Phase 2 — Template System

**Goal:** Build a complete library of note templates covering all object types.

**Deliverables:**
- [ ] Finalize `docs/TEMPLATE_SPEC.md`
- [ ] Daily Note template
- [ ] Weekly Review template
- [ ] Monthly Review template
- [ ] Quarterly Review template
- [ ] Annual Review template
- [ ] Project note template
- [ ] Area note template
- [ ] Person/Contact note template
- [ ] Meeting note template
- [ ] Goal note template
- [ ] Resource/Reference note template
- [ ] Book note template
- [ ] Decision log template
- [ ] Habit tracker template

**Exit Criteria:** All object types have a corresponding template. Templates are tested in a real vault.

---

## Phase 3 — Dashboard Layer

**Goal:** Build Dataview-powered dashboards for all major life domains and system overviews.

**Deliverables:**
- [ ] Finalize `docs/DASHBOARD_SPEC.md`
- [ ] Command Center / Home dashboard
- [ ] Projects dashboard
- [ ] Areas dashboard (per area)
- [ ] Inbox/capture dashboard
- [ ] Weekly review dashboard
- [ ] Habit tracking dashboard
- [ ] Goals dashboard
- [ ] Knowledge/Resources dashboard

**Exit Criteria:** All dashboards render correctly with sample data. Queries are documented with performance notes.

---

## Phase 4 — Automation & Scripting

**Goal:** Automate repetitive vault operations and build external integrations.

**Deliverables:**
- [ ] Finalize `docs/AUTOMATION_SPEC.md`
- [ ] Templater scripts for dynamic note creation
- [ ] Daily note auto-generation script
- [ ] Periodic archiving script
- [ ] Frontmatter validation script
- [ ] Link integrity checker
- [ ] GitHub Actions for spec linting and validation

**Exit Criteria:** Core automations are tested and documented in `tests/`.

---

## Phase 5 — AI Integration

**Goal:** Layer AI capabilities on top of the structured vault.

**Deliverables:**
- [ ] Finalize `docs/AI_OS.md`
- [ ] Define AI provider(s) and integration method
- [ ] AI-assisted capture workflow
- [ ] Daily briefing prompt template
- [ ] Weekly synthesis prompt template
- [ ] Note tagging/categorization assistant
- [ ] Search and retrieval augmentation

**Exit Criteria:** AI workflows are documented with example inputs/outputs. Privacy and data handling policy defined.

---

## Phase 6 — Review & Governance System

**Goal:** Implement the full review cadence and system health monitoring.

**Deliverables:**
- [ ] Finalize `docs/REVIEW_SYSTEM.md`
- [ ] Daily review workflow
- [ ] Weekly review workflow
- [ ] Monthly review workflow
- [ ] Quarterly review workflow
- [ ] Annual review workflow
- [ ] System health checklist
- [ ] Stale note detection automation

**Exit Criteria:** All review workflows are templated and tested through at least one full cycle.

---

## Phase 7 — Hardening & Optimization

**Goal:** Harden the system for long-term use.

**Deliverables:**
- [ ] Performance audit of all Dataview queries
- [ ] Test suite coverage for all scripts
- [ ] Documentation completeness audit
- [ ] Vault backup strategy documented and automated
- [ ] Onboarding guide for new users

**Exit Criteria:** System passes all automated tests. Vault performs acceptably at 5,000+ simulated notes.

---

## TODO

- [ ] Assign target dates to phases once Phase 0 is complete
- [ ] Define "done" criteria for each phase more precisely
- [ ] Add dependency mapping between phases
