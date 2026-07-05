# Document Lifecycle

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document defines the lifecycle stages for every document in the `LifeOS-Enterprise` specification repository. Every document must always have a declared status that reflects its current lifecycle stage.

---

## Lifecycle Stages

```
Draft ──► Review ──► Approved / Accepted ──► Active
                                                │
                                           ─────┴─────
                                          │           │
                                     Superseded   Deprecated
                                          │           │
                                     ─────┴───────────┘
                                          │
                                       Archived
```

---

## Stage Definitions

### Draft

- The document is being authored and has not been submitted for review.
- May be incomplete.
- Must not be referenced as authoritative by any other document.
- Exists on a feature branch; not yet merged to `main`.

**Required fields when a document is Draft:**

```
Status: Draft
Version: 0.x
```

---

### Review

- The document has been submitted as a PR and is under active review.
- May not be treated as authoritative until it reaches `Approved` or `Active`.
- All required reviewers must be added as PR reviewers.

**Required fields:**

```
Status: Review
Version: 0.x
```

---

### Approved (PRDs, User Stories, Product Documents)

- The document has passed all required reviews and been merged to `main`.
- It is the current authoritative version of its content.
- PRDs and product documents use `Approved` rather than `Active` to distinguish them from technical specifications.

**Required fields:**

```
Status: Approved
Version: 1.x or higher
Last Updated: YYYY-MM-DD
```

---

### Accepted (ADRs)

- Architecture Decision Records that have been reviewed and represent an accepted decision.
- An `Accepted` ADR is binding — implementation must conform to it.
- To reverse an accepted ADR, a new ADR must be written and accepted, explicitly superseding the original.

**Required fields:**

```
Status: Accepted
Date: YYYY-MM-DD
Deciders: [list]
```

---

### Active (Standards, Schemas, Governance, Templates)

- The document is in force and is the current canonical version.
- All consumers and implementers must follow it.

**Required fields:**

```
Status: Active
Version: 1.x or higher
Last Updated: YYYY-MM-DD
```

---

### Superseded

- The document has been replaced by a newer version or a different document.
- The original file is retained at its path with a `SUPERSEDED` banner at the top.
- The banner links to the replacement document.
- Implementation repositories must migrate to the replacement.

**Required fields:**

```
Status: Superseded
Superseded By: [link to replacement]
Superseded Date: YYYY-MM-DD
```

**Banner format:**

```markdown
> ⚠️ **SUPERSEDED** — This document has been superseded by [Replacement Document](path/to/replacement.md) as of YYYY-MM-DD. Do not use this document for new work.
```

---

### Deprecated

- The document represents a concept, feature, or decision that is no longer relevant.
- No replacement exists (or is needed).
- The document file is retained with a `DEPRECATED` banner.
- Deprecated documents do not appear in the active [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md).

**Required fields:**

```
Status: Deprecated
Deprecated Date: YYYY-MM-DD
Reason: [brief explanation]
```

**Banner format:**

```markdown
> 🚫 **DEPRECATED** — This document was deprecated on YYYY-MM-DD. Reason: [reason]. It is retained for historical reference only.
```

---

### Archived

- Documents that are both superseded or deprecated AND have been through a formal archival review.
- Archived documents may be moved to an `archive/` subdirectory within their category.
- No document is ever hard-deleted from the repository.

---

## Lifecycle Transitions

| From | To | Who Can Approve | Requirements |
|------|----|----------------|--------------|
| (New) | Draft | Any contributor | Branch created |
| Draft | Review | Author | PR opened |
| Review | Approved / Accepted / Active | Document owner + required reviewers | All review requirements met |
| Active | Superseded | Document owner | Replacement document Active/Approved |
| Active | Deprecated | Document owner + 1 peer reviewer | Reason documented |
| Superseded / Deprecated | Archived | Document owner + Product Owner | Archival review completed |

---

## Document Header Requirements

Every document in this repository must have a header block that includes:

| Field | Required For | Format |
|-------|-------------|--------|
| `Document Type` | All | Policy / PRD / ADR / Schema / Standard / Template / etc. |
| `Owner` | All | Role or team name |
| `Status` | All | One of the lifecycle stages above |
| `Version` | All except ADRs | `MAJOR.MINOR` |
| `Last Updated` | All except ADRs | `YYYY-MM-DD` |
| `Review Cadence` | Standards, Governance | Frequency string |
| `Date` | ADRs | `YYYY-MM-DD` |
| `Deciders` | ADRs | List of roles |

---

## Version Numbering for Documents

Document versions follow a simplified scheme independent of product versioning:

| Increment | When to Use |
|-----------|-------------|
| `0.x` | Draft stage — breaking changes expected |
| `1.0` | First Active/Approved/Accepted version |
| `1.x` (MINOR) | Backward-compatible additions or clarifications |
| `x.0` (MAJOR) | Significant restructuring or breaking content change |

Document version increments do not automatically trigger a product release.

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [VERSIONING_POLICY.md](VERSIONING_POLICY.md)
- [REVIEW_PROCESS.md](REVIEW_PROCESS.md)
- [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md)
