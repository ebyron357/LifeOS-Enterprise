# LifeOS Enterprise — Pre-V1 Pull Request Disposition

**Disposition date:** 2026-07-30  
**Canonical branch:** `main`  
**Governing status:** `docs/CANONICAL_LIVE_STATUS.md`

## Purpose

This document preserves the approved historical intent and traceability of pre-V1 draft pull requests #1, #2, and #3 without merging their obsolete, heavily diverged branches into the current production system.

The branch histories and commits remain available in GitHub. Current `main` is the only active implementation source of truth.

## PR #1 — Phase 0 repository foundation

### Historical value retained

- Initial architecture and project-truth concepts
- Early roadmap and implementation planning
- Initial documentation structure and contribution rules
- Early specifications for metadata, folders, templates, dashboards, plugins, AI, automation, and reviews

### Disposition

Superseded by the operational Obsidian vault, production portal, current README, architecture files, deployment documentation, release notes, and canonical live-status document on `main`.

Do not merge the branch. Preserve it as historical planning evidence.

## PR #2 — Business Engine implementation

### Historical value retained

- Business-centered object-model concept
- Typed domain entities and validation patterns
- Audit, activity, versioning, KPI, relationship, RBAC, and business-health design concepts
- Proposed modular service and repository boundaries

### Disposition

The branch represents an older monorepo/backend direction that diverged before the current vault-first LifeOS V1 product was completed. It is not compatible with current `main` as a direct merge.

Any future backend Business Engine must be designed as a new phase against the current production architecture. The old branch remains research and design evidence only.

## PR #3 — Governance framework

### Historical value retained

- Document lifecycle and change-control concepts
- Versioning, review, decision, quality-gate, and traceability ideas
- Repository index and AI-contribution governance concepts

### Disposition

The useful governance intent is preserved by current repository history, maintained governing documents, the canonical status rule, pull-request review workflow, and complete-document replacement policy. The obsolete branch must not be merged wholesale into current `main`.

Future governance improvements must update the current maintained documents rather than revive this divergent branch.

## Final decision

PRs #1, #2, and #3 are superseded historical drafts. They are closed without merge after their unique intent is recorded here. Their commits and branch histories remain available for audit and future reference.
