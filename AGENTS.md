# LifeOS Enterprise Agent Instructions

## Mission

Finish and maintain this repository as a production-quality LifeOS operating system and Obsidian vault. Work autonomously. Do not stop after reporting issues. Inspect, repair, validate, and repeat until the applicable acceptance checks pass.

## Source of truth and interfaces

- GitHub repository: `ebyron357/LifeOS-Enterprise`
- GitHub is the canonical durable source of truth.
- Obsidian is the primary human knowledge interface.
- AI Headquarters is the workforce/capability, readiness, dispatch, backup, and QC layer.
- Pulse is the registered routine/automation layer.
- The web portal and dashboards are Screen projections: they display canonical truth and may trigger approved workflows, but must not become an independent truth store.
- Machine-specific `.obsidian` state remains local-only.
- Safe shared defaults belong under `config/obsidian`.

## MAPS operating rule

LifeOS uses MAPS in this order: Memory, Agent, Pulse, Screen.

Before broad scanning, start at `MAPS.md` and use its area signposts to locate canonical information.

1. Every durable fact has exactly one canonical home.
2. Maps route to facts; maps do not duplicate facts.
3. Any canonical fact should be reachable from the master map in no more than two routing hops.
4. Broken or stale routes are validation failures.
5. Unattended agents use least privilege and leave inspectable evidence.
6. Recurring unattended work is not operational until registered in `Automations/ROUTINE_REGISTRY.json`.
7. A routine run without evidence is not verified complete.
8. Dashboard-only state is non-authoritative.
9. When Screen conflicts with canonical data, canonical data wins and Screen must be repaired.
10. MAPS architecture details are canonical in `architecture/MAPS_OPERATING_MODEL.md`.

## Operating rules

1. Preserve user notes and project data.
2. Do not commit secrets, workspace state, caches, or machine-specific plugin state.
3. Make safe fixes automatically.
4. Commit each logical repair with a clear message.
5. Rerun validation after every repair group.
6. Continue until validation passes.
7. Do not return an intermediate audit as the final result.
8. Do not send, share, delete, publish, purchase, change credentials, or perform another externally consequential action from an unattended agent unless an approved governing workflow explicitly authorizes it.
9. Never create a second source of truth to solve a navigation problem.

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
- maps
- scripts
- templates
- workflows

## Required operational files

- `MAPS.md`
- `architecture/MAPS_OPERATING_MODEL.md`
- `Automations/ROUTINE_REGISTRY.json`
- `Command Center/Daily Command Center.md`
- `Dashboards/Weekly Review.md`
- `Dashboards/Monthly Review.md`
- `architecture/METADATA_SCHEMA.md`
- `docs/LifeOS_Specification_v1.md`
- `docs/VAULT_REPAIR_REPORT.md`
- `scripts/audit-vault.ps1`
- `scripts/validate-maps.ps1`
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

## Dashboard and Screen standards

- README and documentation notes must not appear in operational tables.
- Filter by `type` and required metadata, not folder membership alone.
- Active projects, blocked items, reviews due, and learning due must render cleanly in Dataview.
- Queries must tolerate missing optional fields without failing.
- Screen reads canonical files, registries, APIs, and run evidence.
- Screen may trigger approved workflows; the owning system writes durable state.
- Every operational status displayed should be traceable to evidence.

## Obsidian configuration standards

- `.obsidian` is local-only and ignored by Git.
- Shared defaults live under `config/obsidian`.
- Setup scripts must be idempotent and non-destructive.
- Homepage target: `00 Home/Life OS.md` (Bases-first navigation).
- Operational command center: `Command Center/Daily Command Center.md`.
- Template folder: `99 Templates` (canonical); legacy `templates/` remains for migration.
- New notes default to `01 Inbox`.

## Validation loop

Run both:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\audit-vault.ps1"
powershell -ExecutionPolicy Bypass -File ".\scripts\validate-maps.ps1"
```

If validation fails:
1. Read the failure.
2. Fix the cause.
3. Rerun validation.
4. Repeat until the scripts exit successfully.

Also verify:
- No unresolved internal Wikilinks remain unless documented.
- No README rows appear in dashboards.
- Required folders and files exist.
- Active project and business metadata are complete.
- Setup and repair scripts preserve local settings.
- `.obsidian` does not cause Git conflicts.
- MAPS routes resolve.
- Pulse registry entries are structurally complete and have evidence paths.

## Final deliverable

Update `docs/VAULT_REPAIR_REPORT.md` with:
- Repairs completed
- Validation evidence
- Final pass/fail state
- Any remaining credential-only, remote-runner-only, or local-UI-only actions

Only declare completion when the applicable validation passes and the Daily Command Center is operational.

## Web vault portal

- The read-only web portal is documented in `docs/WEB_VAULT_PORTAL.md`.
- Agent operating rules for Cursor, Claude Code, and Codex live in `docs/WEB_AGENT_OPERATIONS.md`.
- Privacy exclusions are canonical in `lib/vault/exclusions.ts`.
- The executive dashboard at `/dashboard` must remain operational when portal routes change.
