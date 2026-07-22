# LifeOS Enterprise Agent Instructions

## Mission

Finish and maintain this repository as a production-quality Obsidian LifeOS vault. Work autonomously. Do not stop after reporting issues. Inspect, repair, validate, and repeat until the vault passes its acceptance checks.

## Source of truth

- GitHub repository: `ebyron357/LifeOS-Enterprise`
- Obsidian is the interface.
- GitHub is the source of truth.
- Machine-specific `.obsidian` state must remain local-only.
- Safe shared defaults belong under `config/obsidian`.

## Operating rules

1. Preserve user notes and project data.
2. Do not commit secrets, workspace state, caches, or machine-specific plugin state.
3. Make safe fixes automatically.
4. Commit each logical repair with a clear message.
5. Rerun validation after every repair group.
6. Continue until validation passes.
7. Do not return an intermediate audit as the final result.

## Required vault structure

- AI
- Automations
- Businesses
- Command Center
- Dashboards
- Inbox
- Knowledge
- Learning
- People
- Projects
- Resources
- Reviews
- SOPs
- Tools
- URLs
- architecture
- config
- docs
- integrations
- scripts
- templates
- workflows

## Required operational files

- `Command Center/Daily Command Center.md`
- `Dashboards/Weekly Review.md`
- `Dashboards/Monthly Review.md`
- `architecture/METADATA_SCHEMA.md`
- `docs/LifeOS_Specification_v1.md`
- `docs/VAULT_REPAIR_REPORT.md`
- `scripts/audit-vault.ps1`
- `scripts/setup-obsidian.ps1`
- `scripts/repair-local-vault.ps1`

## Metadata standards

Every active project must include:

- `type: project`
- `status`
- `priority`
- `next_action`
- `review_date`

Every active business must include:

- `type: business`
- `status`
- `priority`
- `review_date`

## Dashboard standards

- README and documentation notes must not appear in operational tables.
- Filter by `type` and required metadata, not folder membership alone.
- Active projects, blocked items, reviews due, and learning due must render cleanly in Dataview.
- Queries must tolerate missing optional fields without failing.

## Obsidian configuration standards

- `.obsidian` is local-only and ignored by Git.
- Shared defaults live under `config/obsidian`.
- Setup scripts must be idempotent and non-destructive.
- Homepage target: `00 Home/Life OS.md` (Bases-first navigation).
- Operational command center: `Command Center/Daily Command Center.md`.
- Template folder: `99 Templates` (canonical); legacy `templates/` remains for migration.
- New notes default to `01 Inbox`.

## Validation loop

Run:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\audit-vault.ps1"
```

If validation fails:

1. Read the failure.
2. Fix the cause.
3. Rerun validation.
4. Repeat until the script exits successfully.

Also verify:

- No unresolved internal Wikilinks remain unless documented.
- No README rows appear in dashboards.
- Required folders and files exist.
- Active project and business metadata are complete.
- Setup and repair scripts preserve local settings.
- `.obsidian` does not cause Git conflicts.

## Final deliverable

Update `docs/VAULT_REPAIR_REPORT.md` with:

- Repairs completed
- Validation evidence
- Final pass/fail state
- Any remaining credential-only or local-UI-only actions

Only declare completion when the vault passes validation and the Daily Command Center is operational.
