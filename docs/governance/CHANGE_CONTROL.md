# Change Control

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document defines the change control process for the `LifeOS-Enterprise` specification repository. It ensures that changes are intentional, traceable, and communicated to all consumers before taking effect.

---

## Change Classification

Every proposed change must be classified before a PR is opened. The classification determines the required review process.

| Class | Definition | Examples |
|-------|-----------|---------|
| **Class 1 — Editorial** | Non-semantic corrections with no impact on implementation | Typo fixes, formatting, link corrections, grammar |
| **Class 2 — Clarification** | Content additions or rewording that do not change meaning or requirements | Adding an example, expanding a description, adding a FAQ entry |
| **Class 3 — Additive** | New content that does not change or remove existing content | New document, new ADR, new PRD, adding a new optional field to a schema |
| **Class 4 — Modification** | Changes to existing requirements, schemas, or standards that are backward-compatible | Relaxing a constraint, adding a new optional API parameter |
| **Class 5 — Breaking** | Changes that require implementation repositories to update their behavior | Removing a field, renaming an endpoint, tightening a validation rule, deprecating an API |

When uncertain, escalate to the next higher class.

---

## Change Request Process

### Step 1: Classify the Change

The author determines the change class using the table above. The classification must be stated in the PR description.

### Step 2: Open a Pull Request

All changes must be proposed via a pull request against `main`. The PR description must include:

- **Change Class** (1–5)
- **Summary** of what is changing and why
- **Affected Documents** — list all documents modified or added
- **Consumer Impact** — describe impact on implementation repositories (if any)
- **Related ADR** — link if this change is motivated by an architecture decision
- **Breaking Change section** (Class 5 only) — migration path for all consumers
- **Checklist** — all applicable items from the quality gates in [QUALITY_GATES.md](QUALITY_GATES.md)

### Step 3: Assign Reviewers

| Class | Required Reviewers | Review SLA |
|-------|--------------------|-----------|
| 1 | 1 (any contributor) | 1 business day |
| 2 | 1 (document owner or delegate) | 2 business days |
| 3 | Document owner + 1 peer | 5 business days |
| 4 | Document owner + Lead Architect | 5 business days |
| 5 | Document owner + Lead Architect + Product Owner | 7 business days |

### Step 4: Review

Reviewers assess the change against:

- Accuracy and completeness
- Consistency with related documents
- Quality gate checklist from [QUALITY_GATES.md](QUALITY_GATES.md)
- Consumer impact and migration path (Class 5)

### Step 5: Merge

- All required approvals must be obtained before merging.
- No self-merges for Class 3–5 changes.
- PR must be up to date with `main` before merging.
- Squash-merge is the default merge strategy for this repository.

### Step 6: Communicate

After merging:

| Class | Communication Required |
|-------|----------------------|
| 1–2 | None required |
| 3 | Update [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md) |
| 4–5 | Notify all implementation repository owners via the communication channels defined in [release-process.md](../release/release-process.md) |

---

## Emergency Change Process

An emergency change is a Class 5 change required to address a critical security vulnerability or a production-blocking defect in the specification.

1. Author opens a PR tagged `[EMERGENCY]` in the title.
2. Minimum 1 approver required (document owner if available; otherwise any Lead).
3. Post-merge review required within 24 hours by the full Class 5 review panel.
4. If the emergency review reveals the change was incorrect, a corrective PR is raised immediately.

Emergency changes bypass the standard SLA but not the merge requirements.

---

## Change Log

Every merged PR that modifies this repository creates a permanent record in Git history. For Class 4–5 changes, a summary entry is also added to the `CHANGELOG` section of the affected document (or a companion changelog file if the document does not have one).

Changelog entry format:

```
## YYYY-MM-DD — vX.Y — [Class N] Title of Change

Summary of what changed.

**Consumer Impact:** Description of impact.
**Migration:** Steps required.
**PR:** #123
```

---

## Rollback

If a merged change is found to be incorrect:

1. A new PR is opened to revert or correct the change (no force-push to `main`).
2. The corrective PR follows the same class process as the original change.
3. If the original change was already consumed by an implementation repository, a communication is sent to all affected teams.

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [REVIEW_PROCESS.md](REVIEW_PROCESS.md)
- [QUALITY_GATES.md](QUALITY_GATES.md)
- [VERSIONING_POLICY.md](VERSIONING_POLICY.md)
- [DECISION_PROCESS.md](DECISION_PROCESS.md)
- [../release/release-process.md](../release/release-process.md)
