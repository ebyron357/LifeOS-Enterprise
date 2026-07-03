# LifeOS Enterprise — Automation Specification

> Defines the automation architecture, inventory, and standards for LifeOS Enterprise.

---

## Overview

Automation in LifeOS Enterprise eliminates routine manual operations, enforces consistency, and ensures the system remains healthy without constant human attention.

Automation exists at two levels:

1. **In-vault automation** — Obsidian/Templater scripts that run inside the vault
2. **External automation** — Scripts that run outside the vault (OS-level, CI/CD)

---

## Automation Principles

### 1. Idempotency
Every automation must be safe to run multiple times without causing unintended side effects. Running a script twice must produce the same result as running it once.

### 2. Non-destructive by Default
Automations never permanently delete notes. They archive, flag, or move — never delete. Destructive operations require explicit human confirmation.

### 3. Transparent Operation
Automations log their actions. Logs are stored in `06-Meta/System/AUTOMATION_LOG.md`.

### 4. Failure Graceful
Automations must handle errors gracefully and notify the user rather than silently failing or corrupting data.

### 5. Version Controlled
All automation scripts are maintained in this repository's `scripts/` directory with full version history.

---

## In-Vault Automation (Templater)

> **Status:** Placeholder — Templater scripts will be built in Phase 4.

### Template-Based Automation

| Script | Trigger | Purpose |
|--------|---------|---------|
| `daily-note-create.js` | Manual / Periodic Notes | Creates dated daily note with context pre-filled |
| `weekly-review-create.js` | Manual | Creates weekly review with last week's stats |
| `project-create.js` | Template | Prompts for project metadata and creates project folder |
| `meeting-note-create.js` | Template | Creates meeting note with attendee links pre-filled |

### Maintenance Automation

| Script | Trigger | Purpose |
|--------|---------|---------|
| `inbox-aging-flag.js` | Daily | Flags inbox items older than 7 days |
| `project-stale-detect.js` | Weekly | Flags projects with no update in 14 days |
| `review-reminder.js` | Periodic | Adds reminder if review is overdue |

---

## External Automation (Scripts)

> **Status:** Placeholder — external scripts will be built in Phase 4.

### Vault Maintenance Scripts

| Script | Language | Purpose |
|--------|---------|---------|
| `validate-frontmatter.py` | Python | Validates all notes against METADATA_SCHEMA |
| `check-link-integrity.py` | Python | Finds broken wikilinks |
| `archive-completed-projects.sh` | Bash | Moves completed projects to archive |
| `export-vault-index.py` | Python | Exports note index for external tooling |
| `daily-backup.sh` | Bash | Backs up vault to defined backup destination |

### CI/CD Automation

| Workflow | Platform | Purpose |
|----------|---------|---------|
| `lint-docs.yml` | GitHub Actions | Lints Markdown documentation in this repository |
| `validate-schemas.yml` | GitHub Actions | Validates template frontmatter against schema definitions |
| `link-check.yml` | GitHub Actions | Checks for broken links in documentation |

---

## Script Standards

### File Naming
- Templater scripts: `kebab-case.js`
- Python scripts: `kebab-case.py`
- Shell scripts: `kebab-case.sh`

### Documentation
Every script must include a header comment block:
```
# Script: [name]
# Purpose: [one-line description]
# Usage: [how to run]
# Dependencies: [required tools or libraries]
# Idempotent: [yes/no]
# Last modified: [date]
```

### Error Handling
- All scripts exit with non-zero status on error
- Error messages include the script name and a descriptive message
- External scripts write errors to stderr

### Testing
Every external script must have a corresponding test file in `tests/`:
- Test file: `tests/[script-name].test.py` or `tests/[script-name].test.sh`
- Tests must run without side effects on the real vault

---

## Automation Log Format

All automations that modify vault content write entries to `06-Meta/System/AUTOMATION_LOG.md`:

```
[YYYY-MM-DD HH:MM] [script-name] ACTION: [description] | Target: [file/folder]
```

---

## TODO

- [ ] Build all P0 Templater scripts in Phase 4
- [ ] Create the `scripts/` directory structure with README files
- [ ] Set up GitHub Actions for documentation linting
- [ ] Define the frontmatter validation schema format
- [ ] Write `validate-frontmatter.py` as the first external script
- [ ] Define the backup strategy and implement `daily-backup.sh`
- [ ] Define test framework for external scripts
