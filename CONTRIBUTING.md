# Contributing to LifeOS Enterprise

Thank you for your interest in contributing to LifeOS Enterprise. This document explains how to contribute effectively and in alignment with the project's standards.

---

## Table of Contents

1. [Before You Contribute](#before-you-contribute)
2. [Types of Contributions](#types-of-contributions)
3. [Development Workflow](#development-workflow)
4. [Documentation Standards](#documentation-standards)
5. [Commit Conventions](#commit-conventions)
6. [Pull Request Guidelines](#pull-request-guidelines)
7. [Code of Conduct](#code-of-conduct)

---

## Before You Contribute

1. **Read [`PROJECT_TRUTH.md`](./PROJECT_TRUTH.md)** — This document defines all canonical decisions. Contributions that contradict it will not be accepted without a formal decision update.
2. **Read [`ARCHITECTURE.md`](./ARCHITECTURE.md)** — Understand the system design before proposing structural changes.
3. **Check open issues and PRs** — Your idea may already be in progress.

---

## Types of Contributions

### Documentation
- Improving existing specification documents in `docs/`
- Filling in `TODO` sections with well-researched content
- Fixing typos, formatting, and broken links

### Templates
- Creating or improving Obsidian note templates in `templates/`
- Templates must follow the schema defined in `docs/TEMPLATE_SPEC.md`

### Scripts & Automation
- Adding scripts to `scripts/` that support vault operations
- Scripts must include inline documentation and a corresponding test in `tests/`

### Specifications
- Writing detailed specifications in `specifications/`
- Must reference and be consistent with `docs/` design documents

### Vault Architecture
- Proposing changes to folder structure, object model, or metadata schema
- These changes require updating `PROJECT_TRUTH.md` as well

---

## Development Workflow

1. **Fork the repository** (or create a branch if you have write access).
2. **Create a feature branch** with a descriptive name:
   ```
   git checkout -b docs/update-object-model
   git checkout -b feat/daily-note-template
   git checkout -b fix/metadata-schema-typos
   ```
3. **Make your changes** following the standards below.
4. **Commit your changes** using the commit conventions below.
5. **Open a pull request** against the `main` branch.

---

## Documentation Standards

- **Markdown only** — All documentation is Markdown. No other formats.
- **YAML frontmatter** — Do not add frontmatter to specification documents unless intentional.
- **Headers** — Use `##` for top-level sections within a document. Reserve `#` for the document title.
- **Tables** — Use Markdown tables for structured comparisons and property lists.
- **TODO sections** — Add `## TODO` sections at the bottom of placeholder documents listing what needs to be completed.
- **No implementation details** — Specification documents describe *what* and *why*, not *how* (unless the document is an implementation guide).
- **Links** — Use relative Markdown links (`./ARCHITECTURE.md`) for cross-document references.
- **Line length** — No hard line-length limit, but keep prose readable.

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

Format:
```
<type>(<scope>): <short description>
```

Types:
| Type | When to Use |
|------|------------|
| `feat` | Adding a new document, template, or script |
| `fix` | Correcting errors in existing content |
| `docs` | Improving existing documentation |
| `refactor` | Restructuring content without changing meaning |
| `chore` | Maintenance tasks (CI, config, folder structure) |
| `test` | Adding or modifying tests |

Examples:
```
docs(object-model): add task and habit object types
feat(templates): add weekly review template
fix(metadata-schema): correct date field type definition
chore: add .github folder structure
```

---

## Pull Request Guidelines

- **One concern per PR** — Don't mix documentation changes with script changes unless they are directly related.
- **Reference issues** — If a PR closes an issue, include `Closes #N` in the PR description.
- **Self-review first** — Read your own diff before requesting review.
- **Description** — Describe *what* changed and *why*. Link to relevant specification documents.
- **Checklist** — Ensure your PR description includes a checklist of changes made.

### PR Description Template

```markdown
## Summary
Brief description of what this PR changes.

## Changes
- Change 1
- Change 2

## Motivation
Why is this change needed?

## References
- Links to relevant docs, issues, or decisions
```

---

## Code of Conduct

This project expects professional, constructive interaction. Contributions must:
- Be respectful of other contributors
- Be focused on improving the project
- Avoid scope creep — stay within the declared purpose of the work

---

## TODO

- [ ] Add issue templates to `.github/`
- [ ] Add pull request template to `.github/`
- [ ] Define code review expectations and SLAs
