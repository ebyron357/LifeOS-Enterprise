# Contributing to LifeOS Enterprise

> **This is a specification-only repository.** It contains no application code. All contributions must be markdown documents that define product requirements, architecture decisions, standards, schemas, or governance policies. See [docs/governance/REPOSITORY_GOVERNANCE.md](docs/governance/REPOSITORY_GOVERNANCE.md) for the full governance framework.

---

## Table of Contents

1. [What Belongs Here](#what-belongs-here)
2. [Repository Workflow](#repository-workflow)
3. [Branch Naming](#branch-naming)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Requirements](#pull-request-requirements)
6. [Review Requirements](#review-requirements)
7. [Documentation Standards](#documentation-standards)
8. [AI Contribution Standards](#ai-contribution-standards)
9. [Quick Reference](#quick-reference)

---

## What Belongs Here

### ✅ Belongs in this repository

- Architecture Decision Records (ADRs)
- Product Requirements Documents (PRDs)
- User stories and acceptance criteria
- Data schemas (TypeScript type definitions in markdown)
- API specifications
- Engineering, security, API, data, and testing standards
- Design system documentation
- Business unit overviews and requirements
- AI agent and MCP integration specifications
- Automation and workflow definitions
- Governance and process documents
- Reusable templates

### ❌ Does not belong here

- Application code (TypeScript, Python, YAML, JSON, etc.)
- Package manager files (`package.json`, `pyproject.toml`, etc.)
- Configuration files for implementation tools
- Runtime dependencies or lock files
- Build artifacts or generated output
- Environment variables or secrets

If you are not sure whether your contribution belongs here, open an issue or discussion before writing the document.

---

## Repository Workflow

All changes to this repository follow the **specification-first** workflow defined in [ADR-001](docs/architecture/decisions/ADR-001-spec-first.md):

```
1. Identify the change needed (new feature, breaking change, clarification)
2. Classify the change (Class 1–5 per CHANGE_CONTROL.md)
3. Create a branch
4. Author the document changes
5. Open a pull request with the required description
6. Pass all applicable quality gates
7. Obtain all required approvals
8. Merge to main
9. Implementation repositories reference the merged commit SHA
```

**The specification is always merged before implementation begins.** Implementation PRs must reference the spec commit SHA that they are implementing.

---

## Branch Naming

Branches must follow this naming convention:

```
{type}/{short-description}
```

### Types

| Type | When to Use |
|------|------------|
| `docs` | New documents or updates to existing documentation |
| `adr` | New or updated Architecture Decision Records |
| `prd` | New or updated Product Requirements Documents |
| `schema` | New or updated schema definitions |
| `standards` | New or updated engineering, security, or other standards |
| `governance` | New or updated governance or process documents |
| `chore` | Repository maintenance (index updates, link fixes, formatting) |

### Examples

```
docs/add-knowledge-graph-stories
adr/004-caching-strategy
prd/update-foundation-acceptance-criteria
schema/add-note-entity
standards/update-security-requirements
governance/update-review-sla
chore/fix-broken-links
```

**Rules:**
- Use lowercase and hyphens only (no underscores, no spaces, no uppercase)
- Keep descriptions short (3–5 words)
- Branch names must be unique; do not reuse old branch names

---

## Commit Conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
{type}({scope}): {description}
```

### Commit Types

| Type | When to Use |
|------|------------|
| `docs` | Adding or updating documentation content |
| `feat` | A new specification document (PRD, ADR, schema, etc.) |
| `fix` | Correcting an error in an existing document |
| `refactor` | Restructuring a document without changing its meaning |
| `chore` | Repository maintenance (index updates, link fixes) |
| `governance` | Changes to governance policies and processes |

### Commit Scopes

Use the document category or file name as the scope:

| Scope | Examples |
|-------|---------|
| `adr` | `feat(adr): add ADR-004 caching strategy` |
| `prd` | `fix(prd): correct acceptance criteria for PRD-001` |
| `schema` | `docs(schema): add Note entity to core-entities` |
| `standards` | `docs(standards): update security password requirements` |
| `governance` | `governance(change-control): add emergency process` |
| `index` | `chore(index): update repository index for new PRD` |

### Commit Message Rules

- **Description:** Imperative mood, lowercase, no trailing period (`add`, `update`, `fix`, not `Added` or `fixes`)
- **Length:** Subject line ≤ 72 characters
- **Body (optional):** After a blank line, explain *why* not *what*
- **Breaking changes:** Add `BREAKING CHANGE: description` in the commit body for Class 5 changes
- **One logical change per commit:** Do not bundle unrelated changes

### Examples

```
feat(adr): add ADR-004 distributed caching strategy

docs(prd): update PRD-002 acceptance criteria for search ranking

fix(schema): correct Task.parentTaskId optional marker

BREAKING CHANGE: Task.assigneeId is now required for tasks in
projects with assigned owners. Migration: set assigneeId to the
project owner for all existing tasks without an assignee.

chore(index): update REPOSITORY_INDEX for new ADR-004
```

---

## Pull Request Requirements

Every pull request must include the following in its description:

### Required PR Description Fields

```markdown
## Change Class
<!-- Class 1 (Editorial) | Class 2 (Clarification) | Class 3 (Additive) | Class 4 (Modification) | Class 5 (Breaking) -->
Class N — [Class name]

## Summary
<!-- What is changing and why? -->

## Affected Documents
<!-- List every document modified or added -->
- `path/to/document.md` — description of change

## Consumer Impact
<!-- How does this affect implementation repositories? -->
<!-- For Class 1–2: None -->

## Related ADR
<!-- Link if this change is motivated by an architecture decision -->

## Breaking Change
<!-- Class 5 only: describe the breaking change and migration path -->

## Quality Gate Checklist
<!-- See docs/governance/QUALITY_GATES.md for full gate definitions -->

### QG-01 Completeness
- [ ] All required sections present and filled
- [ ] No TBD/TODO in active document
- [ ] Related Documents section present

### QG-02 Consistency
- [ ] No internal contradictions
- [ ] Status and version correct
- [ ] No contradiction with accepted ADRs or active standards

<!-- Add applicable gates QG-03 through QG-12 for Class 2+ changes -->
```

### PR Size Guidelines

- **Target:** ≤ 10 documents changed per PR
- **Maximum:** No hard limit, but larger PRs require a more thorough description and may require an additional reviewer
- Group related changes (e.g., a PRD update + the schema update it requires) in the same PR when possible
- Never mix unrelated changes in a single PR

### Draft PRs

Use draft PRs for work-in-progress documents. Draft PRs signal that the document is not yet ready for formal review. Do not request reviews on draft PRs.

---

## Review Requirements

See [docs/governance/REVIEW_PROCESS.md](docs/governance/REVIEW_PROCESS.md) for the full review process.

### Summary

| Change Class | Required Approvers | Review SLA |
|-------------|-------------------|-----------|
| Class 1 | 1 (any contributor) | 1 business day |
| Class 2 | 1 (document owner or delegate) | 2 business days |
| Class 3 | Document owner + 1 peer | 5 business days |
| Class 4 | Document owner + Lead Architect | 5 business days |
| Class 5 | Document owner + Lead Architect + Product Owner | 7 business days |

### Reviewer Responsibilities

- Verify all applicable quality gates are satisfied before approving
- Post comments with clear, actionable feedback using the categories: **Must fix**, **Should fix**, **Consider**
- Mark `Must fix` and `Should fix` comments as `Resolved` after the author addresses them
- Do not block PRs on subjective preferences

### Merge Rules

- No self-merges for Class 3–5 changes
- PR must be up to date with `main` before merging
- Squash-merge is the default merge strategy
- All CI checks must pass (currently: link validation only; see [engineering standards](docs/standards/engineering.md) for implementation repo CI requirements)

---

## Documentation Standards

### Document Header

Every document must begin with a header block:

```markdown
# Document Title

**Document Type:** [Policy | PRD | ADR | Schema | Standard | Template | Reference | Overview]
**Owner:** [Role name]
**Status:** [Draft | Review | Approved | Accepted | Active | Superseded | Deprecated]
**Version:** [MAJOR.MINOR]
**Last Updated:** [YYYY-MM-DD]
**Review Cadence:** [Quarterly | Per release | Per phase | As needed]
```

ADRs use a different header format (see [templates/adr-template.md](templates/adr-template.md)).

### Formatting Rules

- **Headings:** Use `##` for top-level sections within a document; reserve `#` for the document title
- **Tables:** Required for structured comparisons, option lists, and requirement sets
- **Code blocks:** Use fenced code blocks with language identifiers for TypeScript schemas, bash commands, or JSON
- **Links:** Use relative paths for all cross-references within the repository (not absolute URLs)
- **Status indicators:** Use `✅` (complete), `🔄` (in progress), `📋` (planned) consistently in status tables
- **Line length:** Prose text has no hard limit; table cells should be concise
- **No trailing whitespace**
- **Single blank line between sections**

### Lifecycle Status

Update the `Status` field whenever the document changes lifecycle stage. See [docs/governance/DOCUMENT_LIFECYCLE.md](docs/governance/DOCUMENT_LIFECYCLE.md) for all stages and transitions.

### Version Increment

Increment the document `Version` field whenever the document content changes:
- Minor change (clarification, addition): `1.3` → `1.4`
- Breaking content change: `1.4` → `2.0`

See [docs/governance/VERSIONING_POLICY.md](docs/governance/VERSIONING_POLICY.md) for full rules.

### Related Documents Section

Every governance, standards, schema, and API document must end with a `## Related Documents` section listing documents that are directly relevant to understanding or applying the document.

### Registering New Documents

When adding a new document (Class 3+):
1. Add it to [docs/governance/REPOSITORY_INDEX.md](docs/governance/REPOSITORY_INDEX.md) in the correct group
2. Add it to [docs/governance/TRACEABILITY_MATRIX.md](docs/governance/TRACEABILITY_MATRIX.md) with all cross-references
3. Add cross-reference links in all related documents that reference it

---

## AI Contribution Standards

AI agents and AI-assisted tools (including GitHub Copilot) may author or modify documents in this repository subject to the following rules:

### What AI may do

- Draft new documents using the correct template and header format
- Suggest edits to clarify or expand existing content
- Generate initial versions of schemas, acceptance criteria, or ADR sections
- Help identify cross-reference inconsistencies or broken links
- Assist with formatting and structure compliance

### What AI must not do

- Merge a PR without human approval (all quality gates and approvals must be obtained from human reviewers)
- Introduce new product features or requirements not explicitly requested by the product owner
- Modify accepted ADRs without a human-authored superseding ADR
- Remove or deprecate documents without explicit human instruction
- Generate content that contradicts an accepted ADR or active standard without flagging the contradiction for human review

### AI Contribution PR Requirements

PRs authored or significantly assisted by AI must include the following in the PR description:

```markdown
## AI Contribution Notice
This PR was authored with AI assistance (tool: [GitHub Copilot / other]).
All content has been reviewed and is approved by: [human reviewer name/role].
```

### AI Context Freshness

When using AI tools that consume this repository as context:
- Always reference the latest `main` branch, not a stale clone
- Provide the relevant sections of this specification explicitly when prompting
- Verify that AI-generated content does not reference deprecated documents
- AI agents in implementation repositories should reference specification documents by commit SHA for reproducibility

### Audit Trail

All AI-assisted contributions must maintain a complete audit trail through the PR process. The git history and PR comments are the authoritative record of what was changed, why, and who approved it.

---

## Quick Reference

| I want to… | I should… |
|-----------|----------|
| Add a new ADR | Copy [templates/adr-template.md](templates/adr-template.md), branch `adr/NNN-description`, open Class 3 PR |
| Add a new PRD | Copy [templates/prd-template.md](templates/prd-template.md), branch `prd/description`, open Class 3 PR |
| Fix a typo | Branch `chore/fix-typo-in-X`, open Class 1 PR — 1 approver, 1-day SLA |
| Change a schema | Branch `schema/description`, open Class 4 or 5 PR (breaking vs. additive) |
| Update a standard | Branch `standards/description`, open Class 4 PR; ADR required if major |
| Deprecate a document | Branch `docs/deprecate-X`, add deprecation banner, open Class 3 PR |
| Understand the governance model | Read [docs/governance/REPOSITORY_GOVERNANCE.md](docs/governance/REPOSITORY_GOVERNANCE.md) |
| Understand the full document list | Read [docs/governance/REPOSITORY_INDEX.md](docs/governance/REPOSITORY_INDEX.md) |
| Understand quality requirements | Read [docs/governance/QUALITY_GATES.md](docs/governance/QUALITY_GATES.md) |
