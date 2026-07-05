# Repository Governance

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document establishes the governance model for the `LifeOS-Enterprise` specification repository. It defines who owns documents, how decisions are made, what approvals are required, and how this repository serves as the permanent canonical source of truth for all LifeOS Enterprise implementation repositories.

---

## Scope

This governance model applies to:

- All documents in `docs/`
- All documents in `agents/`, `businesses/`, `mcp/`, `automation/`, `workflows/`
- All templates in `templates/`
- All governance documents in `docs/governance/`
- The root `README.md` and `CONTRIBUTING.md`

---

## Guiding Principles

| Principle | Description |
|-----------|-------------|
| Single source of truth | Every product decision, schema, API contract, and standard is defined here before implementation |
| Traceability | Every artifact links to its related decisions, requirements, and release milestones |
| Progressive formality | Minor clarifications need light process; breaking changes need full review |
| Durability | Documents are versioned, never silently deleted |
| AI-readiness | Documents are structured so AI agents can consume them as authoritative context |

---

## Document Ownership

Every document in this repository has a designated owner. The owner is responsible for:

- Keeping the document current and accurate
- Reviewing proposed changes within the defined SLA
- Escalating conflicts to the decision process defined in [DECISION_PROCESS.md](DECISION_PROCESS.md)
- Marking documents as `Deprecated` when superseded

### Ownership Registry

| Document Category | Owner | Backup Owner |
|-------------------|-------|--------------|
| Architecture (ADRs, overview, data-flow) | Lead Architect | CTO |
| Product (PRDs, roadmap, vision, user stories) | Product Owner | Lead Architect |
| Standards (engineering, security, API, data, testing) | Lead Architect | Product Owner |
| Design System (tokens, components, foundations) | Design Lead | Product Owner |
| Schemas (core entities, events, API schemas) | Lead Architect | Lead Engineer |
| API Specifications | Lead Architect | Lead Engineer |
| Release Documents | Release Manager | Lead Architect |
| Business Overviews | Business Owner (per business unit) | Product Owner |
| Agents & MCP | AI Lead | Lead Architect |
| Governance Documents | Product Owner | CTO |
| Templates | Lead Architect | Product Owner |

---

## Approval Requirements

| Change Type | Approvers Required | SLA |
|-------------|-------------------|-----|
| Typo / formatting fix | 1 reviewer (any contributor) | 1 business day |
| Clarification (no semantic change) | 1 reviewer (document owner or delegate) | 2 business days |
| New document | Document owner + 1 peer reviewer | 5 business days |
| Breaking change (schema, API, standard) | Document owner + Lead Architect + Product Owner | 7 business days |
| Deprecation | Document owner + 1 peer reviewer | 5 business days |
| Governance policy change | All: Product Owner + CTO + Lead Architect | 10 business days |

---

## Review Cadence

| Document Category | Review Frequency | Trigger for Ad-hoc Review |
|-------------------|-----------------|---------------------------|
| Architecture ADRs | Per new ADR | New implementation decision |
| PRDs | Per phase milestone | Scope change, new user research |
| Standards | Quarterly | New technology, security advisory |
| Design System | Quarterly | New component, design token change |
| Schemas | Per breaking change | API contract change |
| API Specifications | Per release | Breaking API change |
| Business Overviews | Bi-annually | Business strategy change |
| Roadmap | Monthly | Phase completion, priority shift |
| Governance Documents | Quarterly | Process friction identified |
| Release Documents | Per release | Post-release retrospective |

---

## Deprecation Policy

1. No document is silently deleted. Documents are transitioned through lifecycle stages as defined in [DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md).
2. A deprecated document retains its file at its original path with a `DEPRECATED` header linking to its replacement.
3. Deprecated documents are excluded from the active index but preserved in the repository history.
4. A document may not be deprecated unless its replacement (if one exists) is already merged and active.
5. Deprecation PRs must reference the replacement document or state explicitly that no replacement exists.

---

## Breaking Change Policy

A breaking change is any modification that requires consumers (implementation repositories, AI agents, or other tooling) to update their behavior. Breaking changes include:

- Removing or renaming a field in a schema
- Changing an API contract (endpoint path, method, required parameters, response shape)
- Changing a standard in a way that requires existing code to be modified
- Removing an ADR without a successor
- Changing a data type or validation constraint in a core entity

**Breaking Change Requirements:**

1. A new or updated ADR documenting the decision must be merged before the breaking change document is merged.
2. The PR description must include a `BREAKING CHANGE:` section describing the impact and migration path.
3. The `Last Updated` and version fields of the affected document must be incremented.
4. All documents that reference the changed document must be updated in the same PR or a tracked follow-up.
5. The change must appear in the next release's changelog.

---

## Release Documentation Requirements

Before any product release is tagged in implementation repositories, the following must be true in this specification repository:

- [ ] All PRDs for the phase are at `Approved` status
- [ ] All ADRs for new architectural decisions are at `Accepted` status
- [ ] All schemas referenced by the release are finalized (`Active` status)
- [ ] All API specifications for new endpoints are merged
- [ ] The release plan document (`docs/release/`) is updated to reflect the release
- [ ] The roadmap is updated to mark the phase as complete or in progress
- [ ] The [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) is updated for the release

---

## Related Documents

- [DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [VERSIONING_POLICY.md](VERSIONING_POLICY.md)
- [REVIEW_PROCESS.md](REVIEW_PROCESS.md)
- [DECISION_PROCESS.md](DECISION_PROCESS.md)
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
- [QUALITY_GATES.md](QUALITY_GATES.md)
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
- [../architecture/decisions/ADR-001-spec-first.md](../architecture/decisions/ADR-001-spec-first.md)
