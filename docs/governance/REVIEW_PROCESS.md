# Review Process

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document defines the review process for all changes to the `LifeOS-Enterprise` specification repository. It covers reviewer assignment, review responsibilities, review criteria, and resolution of disagreements.

---

## Review Principles

1. **Reviews are about accuracy and consistency**, not style preference.
2. **Every reviewer is accountable** — approval means the reviewer has verified the content against the review criteria.
3. **No self-merges** for Class 3–5 changes (see [CHANGE_CONTROL.md](CHANGE_CONTROL.md)).
4. **Context over convention** — when in doubt, refer to the problem the document is solving, not the reviewer's personal preference.
5. **Reviews are time-bounded** — unresponsive reviewers may be replaced after the SLA expires.

---

## Reviewer Roles

### Author

- Opens the PR with the correct class designation
- Provides sufficient context in the PR description for reviewers to evaluate the change
- Responds to review comments within 2 business days
- Resolves all comments before requesting re-review

### Reviewer

- Reviews within the SLA defined in [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- Uses the review criteria checklist defined below
- Posts comments with clear, actionable feedback
- Does not block on subjective preferences
- Approves or requests changes — does not leave reviews open indefinitely

### Document Owner

- Has final authority on content accuracy for documents they own
- Must approve any Class 3–5 change to their document
- May delegate review to another qualified reviewer for Class 1–2 changes

### Lead Architect / Product Owner

- Required approvers for Class 4–5 changes
- Evaluate cross-document consistency and strategic alignment
- Escalation path when reviewers disagree

---

## Review Criteria

Reviewers must evaluate the following for every PR:

### All Changes (Class 1–5)

- [ ] Document header fields are present and accurate (`Status`, `Version`, `Last Updated`, `Owner`)
- [ ] Links and cross-references are valid (no broken links to other documents)
- [ ] Language is clear, unambiguous, and consistent with the rest of the repository
- [ ] No implementation code has been introduced (this is a specification-only repository)
- [ ] No secrets, credentials, or sensitive information included

### Class 2+ (Clarification and above)

- [ ] The change is consistent with related documents (check cross-references)
- [ ] Terminology is consistent with the [Terminology Glossary](#terminology-consistency) and existing documents
- [ ] The change does not unintentionally contradict any ADR
- [ ] The `Last Updated` date has been incremented if the document version changed

### Class 3+ (Additive and above)

- [ ] [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md) will be updated (either in this PR or a tracked follow-up)
- [ ] [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) cross-references are updated if the new document has dependencies
- [ ] The document type, owner, and lifecycle status are appropriate
- [ ] Quality gates in [QUALITY_GATES.md](QUALITY_GATES.md) are satisfied

### Class 4–5 (Modification and Breaking)

- [ ] An ADR has been written (or referenced) that justifies the change
- [ ] Consumer impact is described in the PR description
- [ ] All documents that reference the changed document are updated or tracked
- [ ] Breaking changes include a migration path
- [ ] Release documentation requirements in [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md) are met

---

## Review SLAs

| Change Class | Initial Review SLA | Re-review SLA (after author response) |
|-------------|-------------------|--------------------------------------|
| Class 1 | 1 business day | 1 business day |
| Class 2 | 2 business days | 1 business day |
| Class 3 | 5 business days | 2 business days |
| Class 4 | 5 business days | 3 business days |
| Class 5 | 7 business days | 3 business days |

If a required reviewer does not respond within the SLA:

1. Author posts a reminder comment on the PR.
2. After 1 additional business day without response, the author escalates to the backup owner (see [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)).
3. The backup owner may approve the change or assign a substitute reviewer.

---

## Comment Resolution

- **Must fix** — The reviewer has identified a factual error, broken link, or standards violation. Must be resolved before approval.
- **Should fix** — A significant improvement that the reviewer strongly recommends. Requires author to address or provide a documented rationale for not addressing.
- **Consider** — A suggestion the reviewer offers without requiring a response. Author may address or dismiss without explanation.

All `Must fix` and `Should fix` comments must be marked `Resolved` by the reviewer who raised them (not by the author) before the PR is merged.

---

## Periodic Reviews

In addition to change-driven reviews, the following documents undergo scheduled periodic reviews:

| Trigger | Documents Reviewed | Who Reviews |
|---------|-------------------|-------------|
| Quarterly | All Standards, All Governance | Document owners + Lead Architect |
| Phase completion | All PRDs for the phase, Release documents | Product Owner + Lead Architect |
| New ADR accepted | All documents that reference the superseded decision | Document owners of affected documents |
| Security advisory | Security standards, API specifications | Lead Architect + Security Lead |

Periodic reviews result in either:
- No change (document confirmed current)
- A new PR following the standard change process

---

## Disagreement Resolution

When reviewers cannot reach consensus:

1. **Direct resolution** — Author and reviewer discuss the specific concern in the PR thread. Most disagreements are resolved here.
2. **Escalation** — If unresolved after 2 business days, the document owner makes the call.
3. **Decision process** — If the document owner is unavailable or the disagreement involves a cross-cutting concern, the full process in [DECISION_PROCESS.md](DECISION_PROCESS.md) is invoked.

---

## Terminology Consistency

Reviewers must flag any term that conflicts with established terminology used across this repository. Canonical terms include:

| Term | Definition |
|------|-----------|
| Operator | A human user of LifeOS Enterprise who manages one or more business units |
| Business Unit | An isolated organizational entity within LifeOS Enterprise |
| Agent | An AI agent that performs actions within LifeOS Enterprise |
| Spec / Specification | This repository and its contents |
| Implementation repository | A codebase that builds LifeOS Enterprise using this spec as its source of truth |
| Breaking change | Any change requiring consumers to update their behavior |
| ADR | Architecture Decision Record |
| PRD | Product Requirements Document |

New terminology must be defined when introduced and added to this table via a Class 2+ PR.

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [QUALITY_GATES.md](QUALITY_GATES.md)
- [DECISION_PROCESS.md](DECISION_PROCESS.md)
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
