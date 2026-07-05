# Versioning Policy

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document defines the versioning scheme for the `LifeOS-Enterprise` specification repository and its relationship to product releases, document versions, and schema evolution. Consistent versioning ensures every implementation repository can unambiguously reference the specification it was built against.

---

## Versioning Layers

LifeOS Enterprise uses three distinct versioning layers:

| Layer | What It Versions | Scheme |
|-------|-----------------|--------|
| **Repository** | The specification as a whole | Git tags: `spec/vMAJOR.MINOR.PATCH` |
| **Product** | The deployed product | SemVer: `vMAJOR.MINOR.PATCH` (see release-process.md) |
| **Document** | Individual specification documents | `MAJOR.MINOR` (see DOCUMENT_LIFECYCLE.md) |

These three layers are independent but aligned at major release boundaries.

---

## Repository Versioning

### Tagging

The specification repository is tagged at each product release milestone:

```
spec/v1.0.0   — Phase 1 (Foundation) specification baseline
spec/v1.1.0   — Minor spec update accompanying product v1.1.0
spec/v2.0.0   — Phase 2 (Knowledge Graph) specification baseline
```

Tags follow the pattern `spec/vMAJOR.MINOR.PATCH`.

### What a Tag Represents

A `spec/vX.Y.Z` tag represents the state of the specification that:
- Was ratified before product release `vX.Y.Z` began implementation
- Is the authoritative reference for that product release
- Must be referenced by implementation PRs via commit SHA or tag name

### Referencing the Specification

Implementation repositories must reference the specification in their PR descriptions:

```
Spec reference: spec/v1.0.0 (commit abc1234)
```

For in-progress work on `main` (pre-release), reference the full commit SHA:

```
Spec reference: commit abc1234 (pre-release, targeting spec/v1.1.0)
```

---

## Document Versioning

Each document carries its own version in its header block, independent of the repository version.

### Version Format

`MAJOR.MINOR`

| Version Range | Meaning |
|--------------|---------|
| `0.x` | Draft — content subject to breaking changes |
| `1.0` | First ratified version |
| `1.x` | Backward-compatible changes (additions, clarifications) |
| `2.0+` | Major revision — significant restructuring or breaking content change |

### Incrementing Rules

| Change | MAJOR | MINOR |
|--------|-------|-------|
| Adding new content without changing existing | — | +1 |
| Clarifying existing content without changing requirements | — | +1 |
| Changing a requirement in a backward-compatible way | — | +1 |
| Removing content, changing requirements in a breaking way | +1 | reset to 0 |
| First ratification from Draft | Set to 1.0 | — |

Document version does not reset when the repository tag increments.

---

## Schema Versioning

Schemas (in `docs/schemas/`) require special attention because they have direct implementation impact.

### Schema Version Rules

1. All schema changes must increment the document version per the rules above.
2. Breaking schema changes (removing fields, changing types, tightening constraints) require:
   - A new major document version (`x.0`)
   - An ADR documenting the migration strategy
   - A migration guide section within the schema document or a linked migration document
3. Additive schema changes (new optional fields) increment the minor document version only.
4. Schema field names and types are frozen once the schema reaches `Active` status. Changes require the breaking change process.

### Schema Compatibility Guarantee

| Schema Status | Compatibility Guarantee |
|---------------|------------------------|
| Draft (`0.x`) | None — breaking changes expected |
| Active (`1.x`) | Backward-compatible within MINOR versions |
| Active (`x.0` new MAJOR) | Breaking — migration required |

---

## API Versioning

API specifications (in `docs/api/`) follow the same document versioning rules, plus:

1. The URL version (`/api/v1/`) increments with each breaking API change.
2. An API specification document reaching version `2.0` signals that `/api/v2/` endpoints should be introduced in implementation.
3. Both API versions remain supported until the prior version is formally deprecated (minimum 90-day overlap for production APIs).

---

## ADR Versioning

Architecture Decision Records are numbered sequentially (`ADR-001`, `ADR-002`, etc.) and are considered immutable once `Accepted`. ADRs are not versioned with `MAJOR.MINOR` because they record a point-in-time decision.

To change an accepted decision:
1. Write a new ADR explicitly superseding the prior one.
2. Update the prior ADR's `Status` field to `Superseded` and add a `Superseded By` link.

---

## Version Alignment at Release

At each major product release, the following alignment occurs:

1. All specification documents for the release phase are reviewed and finalized.
2. Document versions are incremented to reflect any changes made during the release cycle.
3. The repository is tagged `spec/vX.0.0` after all documents are finalized.
4. The tag commit SHA is recorded in the product release notes.

---

## Changelog

### 1.0 — 2026-07-05

Initial versioning policy established.

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [../release/release-process.md](../release/release-process.md)
- [../schemas/core-entities.md](../schemas/core-entities.md)
- [../api/overview.md](../api/overview.md)
- [../architecture/decisions/ADR-001-spec-first.md](../architecture/decisions/ADR-001-spec-first.md)
