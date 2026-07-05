# Decision Process

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document defines how decisions are made in the `LifeOS-Enterprise` specification repository. It distinguishes routine decisions (handled by the change control process) from significant decisions that require a formal record, and defines escalation paths for conflicts.

---

## Decision Categories

| Category | Description | Record Required |
|----------|-------------|----------------|
| **Routine** | Day-to-day authoring and clarification within established patterns | No — PR approval is sufficient |
| **Architectural** | Technology choices, system design patterns, integration approaches | Yes — ADR required |
| **Product** | Feature scope, user story prioritization, acceptance criteria | Yes — PRD or PRD update required |
| **Standards** | Changes to engineering, security, API, data, or testing standards | Yes — Standards document update + ADR if major |
| **Governance** | Changes to this governance framework | Yes — Governance document update |
| **Strategic** | Phase prioritization, business model, external partnerships | Yes — Vision or roadmap update |

---

## Architectural Decision Records (ADRs)

All architectural decisions must be captured as ADRs before implementation begins.

### When an ADR Is Required

An ADR is required when:
- Introducing a new technology, framework, or infrastructure component
- Choosing between two or more viable technical approaches
- Reversing or modifying an existing accepted ADR
- Making a decision with significant long-term consequences that is difficult to reverse
- Adopting a cross-cutting pattern that will affect multiple implementation repositories

An ADR is **not** required for:
- Implementation details within an already-decided approach
- Routine feature additions that fit established patterns
- Editorial or clarification changes

### ADR Lifecycle

```
Proposed ──► Discussion ──► Accepted
                                │
                           ─────┴──────
                          │            │
                     Superseded     Deprecated
```

| Status | Meaning |
|--------|---------|
| Proposed | ADR is open for discussion; no decision made |
| Accepted | Decision has been ratified; implementation must conform |
| Superseded | A newer ADR replaces this one; original is retained |
| Deprecated | The decision is no longer relevant (feature removed, etc.) |

### ADR Numbering

ADRs are numbered sequentially: `ADR-001`, `ADR-002`, etc. Numbers are never reused.

### ADR Template

See [templates/adr-template.md](../../templates/adr-template.md) for the required format.

Every ADR must include:
- **Context** — The problem being solved and why a decision is needed
- **Decision** — What was decided, stated clearly
- **Options Considered** — Alternatives evaluated (minimum 2 options, including the chosen one)
- **Consequences** — Positive, negative, and neutral consequences
- **Mitigations** — How the negative consequences will be addressed

### ADR Review and Acceptance

1. ADR is opened as a PR by the author.
2. All stakeholders are invited to comment during a defined discussion period (minimum 3 business days for Class 4, 5 business days for Class 5).
3. The Lead Architect and Product Owner must both approve before an ADR reaches `Accepted`.
4. Once accepted, an ADR is binding on all implementation repositories.
5. To reverse an accepted ADR, a new ADR must be written and accepted. The original ADR's status is changed to `Superseded`.

---

## Product Decisions

Product decisions are captured in PRDs and user stories. The decision process for product scope:

1. **Proposal** — Product Owner drafts a PRD or user story update.
2. **Stakeholder Review** — Minimum 5-day review period; all relevant stakeholders review.
3. **Approval** — Product Owner has final authority on product scope. Lead Architect reviews for technical feasibility.
4. **Record** — Merged PRD is the authoritative record of the product decision.

---

## Governance Decisions

Changes to the governance framework (this document and its siblings) require:

1. A PR opened by any contributor with a clear rationale.
2. Review and approval from: Product Owner + CTO + Lead Architect.
3. A 7-day comment period before merging (to allow all stakeholders to weigh in).
4. No emergency process applies to governance changes except in exceptional circumstances ratified by all three required approvers.

---

## Conflict Resolution

When two or more stakeholders disagree on a decision:

### Level 1 — Direct Discussion

Parties discuss the conflict in the PR thread. The goal is to reach consensus within 2 business days. Most conflicts resolve here.

### Level 2 — Document Owner Ruling

If consensus is not reached, the document owner makes a binding ruling and documents the rationale in a PR comment. The ruling is final unless escalated.

### Level 3 — Founding Team Escalation

If the document owner's ruling is disputed, any party may escalate to the founding team (CTO + Product Owner + Lead Architect). The founding team reviews within 3 business days and issues a final ruling.

Escalations are documented in the PR. The final ruling closes the discussion. Re-opening the same dispute requires new material information.

### Level 4 — Strategic Decision

If a conflict cannot be resolved through the above levels (e.g., fundamental strategic disagreement), it is escalated to the organization's executive decision-making body. Such decisions are rare and require a formal record in the repository's documentation.

---

## Decision Traceability

Every significant decision (ADR, PRD, standards change) must be linked in [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md). This ensures that any document can be traced back to the decision that motivated it and forward to the implementation artifacts that depend on it.

---

## Decision Communication

After a significant decision is made:

| Audience | What | When |
|----------|------|------|
| All contributors to this repo | Notification via PR merge | Immediately on merge |
| Implementation repository owners | Direct notification for ADRs and breaking standard changes | Within 1 business day of merge |
| AI agents (context update) | No action required — agents read this repo as context | On next context refresh |

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [REVIEW_PROCESS.md](REVIEW_PROCESS.md)
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
- [../../templates/adr-template.md](../../templates/adr-template.md)
- [../architecture/decisions/ADR-001-spec-first.md](../architecture/decisions/ADR-001-spec-first.md)
