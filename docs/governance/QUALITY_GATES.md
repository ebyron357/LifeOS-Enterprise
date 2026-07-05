# Quality Gates

**Document Type:** Policy  
**Owner:** LifeOS Enterprise Founding Team  
**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Review Cadence:** Quarterly  

---

## Purpose

This document defines the mandatory quality gates for all documentation in the `LifeOS-Enterprise` specification repository. Quality gates are enforced at review time. A PR may not be merged until every applicable gate has been verified and checked off.

Quality gates apply to the document being added or modified. Reviewers are accountable for verifying them.

---

## Gate Overview

| Gate | ID | Applies To | Class Threshold |
|------|----|-----------|----------------|
| Completeness | QG-01 | All documents | Class 1+ |
| Consistency | QG-02 | All documents | Class 1+ |
| Cross-Reference Validation | QG-03 | All documents | Class 2+ |
| Terminology Consistency | QG-04 | All documents | Class 2+ |
| Schema References | QG-05 | Schemas, PRDs, APIs, Standards | Class 3+ |
| Security Review | QG-06 | Standards, Schemas, APIs, PRDs | Class 4+ |
| API Review | QG-07 | API specs, Schemas | Class 3+ |
| Acceptance Criteria Verification | QG-08 | PRDs, User Stories | Class 3+ |
| Governance Alignment | QG-09 | All governance docs | Class 3+ |
| Breaking Change Assessment | QG-10 | Any document | Class 4+ |
| Release Alignment | QG-11 | PRDs, Schemas, APIs, Release docs | Class 3+ |
| Traceability Update | QG-12 | All new documents | Class 3+ |

---

## Gate Definitions

---

### QG-01 — Completeness

**Applies to:** All documents  
**Class threshold:** Class 1+

A document is complete when every section that its document type requires is present and substantively filled.

**Checklist:**

- [ ] Document header block is present with all required fields (`Document Type`, `Owner`, `Status`, `Version`, `Last Updated`)
- [ ] All required sections for the document type are present (see type requirements below)
- [ ] No sections contain only placeholder text (e.g., "TBD", "TODO", "Coming soon") unless explicitly marked `Draft`
- [ ] Related Documents section is present (for governance, standards, schemas, and API docs)
- [ ] Tables have no empty required cells

**Document Type — Required Sections:**

| Document Type | Required Sections |
|--------------|------------------|
| ADR | Context, Decision, Options Considered, Consequences, Mitigations |
| PRD | Overview, Goals, Non-Goals, User Stories, Acceptance Criteria, Data Model references, Security Requirements |
| User Story | As a / I want to / So that, Acceptance Criteria (minimum 3 criteria per story) |
| Schema | Conventions, all entity definitions with typed fields |
| Standard | Purpose, numbered rules or requirements |
| Governance | Purpose, Scope (or equivalent), all subsections defined in the document type |

---

### QG-02 — Consistency

**Applies to:** All documents  
**Class threshold:** Class 1+

The document must be internally consistent and consistent with the rest of the repository.

**Checklist:**

- [ ] No contradictions within the document itself
- [ ] Document status in the header matches the actual state of the content (e.g., not `Active` while containing large TODO sections)
- [ ] Version number follows the rules in [VERSIONING_POLICY.md](VERSIONING_POLICY.md)
- [ ] `Last Updated` date is current (matches the date of the most recent substantive edit)
- [ ] Document does not contradict any `Accepted` ADR unless a new superseding ADR accompanies the change
- [ ] Document does not contradict any `Active` Standard unless a standard update accompanies the change

---

### QG-03 — Cross-Reference Validation

**Applies to:** All documents  
**Class threshold:** Class 2+

All links within the document must resolve to real files in the repository.

**Checklist:**

- [ ] Every relative link in the document is valid (target file exists at the referenced path)
- [ ] Every document referenced by name or number (e.g., `PRD-001`, `ADR-002`) corresponds to a real document
- [ ] No orphaned references to documents that do not yet exist, unless the PR also adds those documents or they are explicitly marked as `[Planned]`
- [ ] Entity names referenced in schemas match the actual field names in `docs/schemas/core-entities.md`
- [ ] API endpoint paths referenced in PRDs or standards match the paths defined in `docs/api/`

---

### QG-04 — Terminology Consistency

**Applies to:** All documents  
**Class threshold:** Class 2+

Terms must be used consistently with their definitions in [REVIEW_PROCESS.md](REVIEW_PROCESS.md#terminology-consistency) and with their usage across the repository.

**Checklist:**

- [ ] "Operator" is used for human users of LifeOS Enterprise (not "user", "admin", or "customer" unless quoting)
- [ ] "Business Unit" is capitalized and used consistently (not "workspace", "org", or "tenant" unless a specific layer requires it)
- [ ] "Agent" refers to AI agents, not human reviewers or third-party services
- [ ] "Spec" or "Specification" refers to this repository, not to an external standard
- [ ] "Implementation repository" refers to a codebase building LifeOS Enterprise
- [ ] "Breaking change" is only applied to changes that meet the definition in [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [ ] Any new term introduced in this document is defined inline or added to the terminology table in [REVIEW_PROCESS.md](REVIEW_PROCESS.md)

---

### QG-05 — Schema References

**Applies to:** Schemas, PRDs, APIs, Standards  
**Class threshold:** Class 3+

All references to data entities must be grounded in the canonical schemas.

**Checklist:**

- [ ] Every entity name used in the document corresponds to an entity defined in `docs/schemas/core-entities.md` or `docs/schemas/event-schemas.md`
- [ ] Every field name referenced in a PRD acceptance criterion matches the field name in the canonical schema
- [ ] New entities introduced in a PRD are accompanied by a schema document update in the same PR or a tracked follow-up
- [ ] Field types referenced in API specifications match the types defined in the canonical schema
- [ ] Prefixed ULID conventions (`usr_`, `bu_`, `proj_`, etc.) are used correctly

---

### QG-06 — Security Review

**Applies to:** Standards, Schemas, APIs, PRDs  
**Class threshold:** Class 4+

Changes with security implications require explicit security review.

**Checklist:**

- [ ] Any authentication or authorization mechanism introduced is consistent with `docs/standards/security.md`
- [ ] Any new API endpoint involving user data includes authorization requirements
- [ ] Any new schema entity that stores sensitive data (credentials, PII, financial data) includes a note on encryption-at-rest and access control requirements
- [ ] Password, token, and session policies are consistent with `docs/api/authentication.md`
- [ ] No security-relevant fields (passwords, tokens, secrets) appear in response schemas or event payloads without explicit justification
- [ ] Rate limiting requirements are specified for any new authentication or high-frequency endpoint
- [ ] Data retention and deletion policies are addressed for any new entity that stores personal data

---

### QG-07 — API Review

**Applies to:** API specifications, Schemas  
**Class threshold:** Class 3+

All API changes must conform to the API design standards.

**Checklist:**

- [ ] New or changed endpoints follow naming conventions in `docs/standards/api.md`
- [ ] HTTP methods are semantically correct (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletions)
- [ ] All response schemas are defined in `docs/schemas/api-schemas.md` or inline in the API spec
- [ ] All 4xx and 5xx error responses use the canonical error schema from `docs/schemas/api-schemas.md`
- [ ] Pagination conventions are followed for list endpoints
- [ ] Versioning rules from [VERSIONING_POLICY.md](VERSIONING_POLICY.md) are applied to any breaking API change
- [ ] OpenAPI 3.1 compatibility is noted for any new endpoint definition

---

### QG-08 — Acceptance Criteria Verification

**Applies to:** PRDs, User Stories  
**Class threshold:** Class 3+

Acceptance criteria must be testable and traceable.

**Checklist:**

- [ ] Every user story has at least 3 acceptance criteria
- [ ] Every acceptance criterion is testable (i.e., a binary pass/fail result can be determined)
- [ ] Acceptance criteria do not describe implementation details (no "the database stores…" — only observable behavior)
- [ ] Performance-sensitive criteria reference a specific numeric threshold
- [ ] Security-sensitive criteria reference the relevant standard or constraint
- [ ] Acceptance criteria in PRDs have unique identifiers (e.g., `AC-001`, `AC-002`)
- [ ] All acceptance criteria in the PRD are represented in at least one user story

---

### QG-09 — Governance Alignment

**Applies to:** All governance documents  
**Class threshold:** Class 3+

Governance documents must be internally consistent with each other.

**Checklist:**

- [ ] Change class definitions are consistent with those in [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [ ] Review SLAs are consistent with those in [REVIEW_PROCESS.md](REVIEW_PROCESS.md)
- [ ] Lifecycle stage names and definitions are consistent with [DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md)
- [ ] Versioning terminology is consistent with [VERSIONING_POLICY.md](VERSIONING_POLICY.md)
- [ ] Owner role names are consistent with those in [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [ ] Any new governance rule is not in conflict with the decision process in [DECISION_PROCESS.md](DECISION_PROCESS.md)

---

### QG-10 — Breaking Change Assessment

**Applies to:** Any document  
**Class threshold:** Class 4+

Breaking changes must be identified, assessed, and communicated before merging.

**Checklist:**

- [ ] The PR description contains a `BREAKING CHANGE:` section (for Class 5 changes)
- [ ] The breaking change section identifies all consumers that must be updated
- [ ] A migration path is described for each impacted consumer
- [ ] The affected document's version has been incremented to the next MAJOR version (e.g., `1.x` → `2.0`)
- [ ] All documents that reference the changed document are updated in this PR or have a tracked issue referencing the update
- [ ] An ADR has been created or referenced that justifies the breaking change
- [ ] The change is reflected in the release plan for the next applicable version

---

### QG-11 — Release Alignment

**Applies to:** PRDs, Schemas, APIs, Release documents  
**Class threshold:** Class 3+

Documentation changes must align with the active release plan.

**Checklist:**

- [ ] The document's phase assignment is consistent with `docs/product/roadmap.md`
- [ ] Any new entity or API endpoint is represented in the applicable release plan
- [ ] Documents marked `Active` or `Approved` that are scoped to a future phase are not referenced as current requirements
- [ ] The release plan document is updated if this change adds to or removes from a phase's scope
- [ ] Post-phase documents (e.g., a PRD for Phase 3 features) do not introduce dependencies on Phase 2 documents that are still `Draft`

---

### QG-12 — Traceability Update

**Applies to:** All new documents  
**Class threshold:** Class 3+

Every new document must be registered in the traceability matrix and index.

**Checklist:**

- [ ] The new document is added to [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) in the correct section
- [ ] All dependencies (ADRs, PRDs, schemas, APIs) are listed in the matrix entry
- [ ] The new document is added to [REPOSITORY_INDEX.md](REPOSITORY_INDEX.md) in the correct group
- [ ] All documents that the new document references have cross-references added back (bidirectional traceability)

---

## Quality Gate Checklist Template

Use this checklist in PR descriptions for the applicable change class:

```markdown
## Quality Gate Checklist

### QG-01 Completeness
- [ ] All required sections present and filled
- [ ] No TBD/TODO in active document
- [ ] Related Documents section present

### QG-02 Consistency
- [ ] No internal contradictions
- [ ] Status and version correct
- [ ] No contradiction with accepted ADRs or active standards

### QG-03 Cross-Reference Validation (Class 2+)
- [ ] All links resolve to real files
- [ ] All document references are valid
- [ ] Entity/field names match canonical schemas

### QG-04 Terminology Consistency (Class 2+)
- [ ] Canonical terms used correctly
- [ ] New terms defined or added to terminology table

### QG-05 Schema References (Class 3+, if applicable)
- [ ] All entities in canonical schemas
- [ ] Field names match schema definitions

### QG-06 Security Review (Class 4+, if applicable)
- [ ] Auth/authz consistent with security standards
- [ ] Sensitive data handling addressed

### QG-07 API Review (Class 3+, if applicable)
- [ ] Endpoint conventions followed
- [ ] Error schemas correct

### QG-08 Acceptance Criteria (Class 3+, if applicable)
- [ ] Stories have ≥ 3 testable criteria
- [ ] Criteria are behavior-observable

### QG-09 Governance Alignment (Class 3+, governance docs only)
- [ ] Consistent with all governance sibling documents

### QG-10 Breaking Change Assessment (Class 4+)
- [ ] BREAKING CHANGE section in PR description
- [ ] Migration path described

### QG-11 Release Alignment (Class 3+, if applicable)
- [ ] Phase assignment consistent with roadmap

### QG-12 Traceability Update (Class 3+, new documents)
- [ ] Added to TRACEABILITY_MATRIX.md
- [ ] Added to REPOSITORY_INDEX.md
```

---

## Related Documents

- [REPOSITORY_GOVERNANCE.md](REPOSITORY_GOVERNANCE.md)
- [CHANGE_CONTROL.md](CHANGE_CONTROL.md)
- [REVIEW_PROCESS.md](REVIEW_PROCESS.md)
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
- [DOCUMENT_LIFECYCLE.md](DOCUMENT_LIFECYCLE.md)
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
