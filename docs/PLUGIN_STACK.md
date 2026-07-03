# LifeOS Enterprise — Plugin Stack

> Defines the Obsidian community plugins used in LifeOS Enterprise, with justification for each.

---

## Overview

The plugin stack is intentionally minimal. Each plugin must earn its place by providing essential capability that cannot be reasonably achieved with native Obsidian features or lighter-weight alternatives.

**Plugin selection criteria:**
1. Active maintenance (last update within 12 months)
2. Wide community adoption (stability signal)
3. Clear, non-overlapping purpose
4. Performance impact is acceptable at scale
5. Graceful degradation — vault is functional if plugin is disabled

---

## Plugin Categories

| Category | Purpose |
|----------|---------|
| Core Functionality | Capabilities fundamental to the system |
| Templating | Note creation and dynamic content |
| Querying | Data aggregation and display |
| Review & Tracking | Habits, reviews, and periodic notes |
| AI & Augmentation | AI-assisted workflows |
| Navigation & UX | Improved vault navigation |
| Utilities | Supporting tools |

---

## Required Plugins

> **Status:** Placeholder — plugin versions and configuration will be finalized in Phase 1.

### Core Functionality

| Plugin | Purpose | Justification |
|--------|---------|--------------|
| **Dataview** | Query and display structured note data | Essential for all dashboards and reviews |
| **Templater** | Advanced note templating and scripting | Required for dynamic template creation |
| **Periodic Notes** | Daily, weekly, monthly note automation | Drives the review system cadence |

---

### Navigation & UX

| Plugin | Purpose | Justification |
|--------|---------|--------------|
| **Omnisearch** | Full-text search across vault | Native search is insufficient at scale |
| **Quick Switcher++** | Enhanced note switching | Productivity multiplier for navigation |

---

### Review & Tracking

| Plugin | Purpose | Justification |
|--------|---------|--------------|
| **Tasks** | Task tracking and filtering | Required for task management across notes |
| **Habit Tracker** | Habit visualization | TBD — evaluate in Phase 2 |

---

### AI & Augmentation

| Plugin | Purpose | Justification |
|--------|---------|--------------|
| **Copilot** | AI chat and note synthesis | TBD — evaluate in Phase 5 |

---

### Utilities

| Plugin | Purpose | Justification |
|--------|---------|--------------|
| **Linter** | Frontmatter and Markdown linting | Enforces schema consistency |
| **Advanced Tables** | Table editing | Improves Markdown table authoring |
| **File Color** | Visual folder organization | Improves navigability at scale |

---

## Deferred / Under Evaluation

These plugins are candidates for inclusion but have not been evaluated against the selection criteria.

| Plugin | Category | Consideration |
|--------|----------|--------------|
| Canvas | Visual thinking | Native feature — no plugin needed |
| Excalidraw | Diagramming | Evaluate for architecture diagrams |
| Database Folder | Spreadsheet view | May overlap with Dataview |
| Readwise Official | Book highlights sync | Evaluate for learning workflow |
| Natural Language Dates | Date parsing | Quality-of-life for date entry |

---

## Prohibited Plugin Patterns

The following plugin patterns are explicitly **not** permitted:

- **Theme customization plugins** — Themes are selected separately and not managed here
- **Sync plugins** — Sync strategy is defined separately (see PROJECT_TRUTH.md)
- **Plugins that write to frontmatter in non-standard formats** — All frontmatter must conform to METADATA_SCHEMA.md

---

## Plugin Configuration

All plugin configuration is documented in `specifications/plugin-configs/`. Configuration files are maintained in this repository for version control and reproducibility.

> **TODO:** Plugin configuration files will be created in Phase 1.

---

## Plugin Update Policy

- Plugins are updated after reviewing the changelog for breaking changes
- Major plugin updates are tested in a sandbox vault before applying to the production vault
- Plugin updates are logged in CHANGELOG.md

---

## TODO

- [ ] Evaluate and finalize all plugin selections with specific version requirements
- [ ] Create configuration specifications for each required plugin
- [ ] Define the vault setup script that installs and configures all plugins
- [ ] Assess performance impact of each plugin at 5,000+ note scale
- [ ] Document the minimum Obsidian version required
- [ ] Create a plugin evaluation rubric
