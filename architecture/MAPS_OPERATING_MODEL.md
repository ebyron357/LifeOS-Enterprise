# LifeOS Enterprise — MAPS Operating Model

## Status
Canonical architecture rule for LifeOS Enterprise.

## Purpose
MAPS is integrated into LifeOS as an operating discipline, not as a separate product or duplicate source of truth.

## Ownership model
- GitHub repository `ebyron357/LifeOS-Enterprise` is the canonical durable source of truth.
- Obsidian is the primary human knowledge interface.
- AI Headquarters is the workforce/capability and dispatch layer.
- Automations/Pulse execute registered routines and write evidence.
- The web portal and dashboards are Screen projections. They display canonical data; they do not become an independent truth store.

## M — Memory
Goal: any canonical fact should be discoverable from the master map in no more than two routing hops.

Rules:
1. Every durable fact has exactly one canonical home.
2. Maps contain routing metadata, not duplicate business facts.
3. `MAPS.md` is the master signpost.
4. Area signposts live in `maps/`.
5. Broken, duplicate, orphaned, or stale routes are validation failures.
6. Project/business operational metadata remains in its canonical note.

## A — Agent
Goal: agents work against the same canonical repository and obey the same controls.

Rules:
1. Agents read `AGENTS.md` before making changes.
2. Agents use the maps to locate truth before broad repository scans.
3. Unattended agents must use least privilege.
4. Sending, sharing, deleting, publishing, purchasing, credential changes, or other externally consequential actions require explicit authorization unless a governing workflow already grants it.
5. Agents must leave inspectable evidence for unattended work.
6. AI Headquarters owns workforce readiness, capability, assignment, backup, QC, cost/capacity, permissions, and connection state.

## P — Pulse
Goal: recurring work runs from an explicit registry and produces evidence.

Canonical files:
- `Automations/ROUTINE_REGISTRY.json`
- `Automations/runs/`

Each routine must declare:
- id and name
- enabled state
- schedule
- execution machine
- command/workflow
- owner
- timeout/turn or equivalent resource limit
- failure cap
- evidence location

Evidence contract:
- Each routine keeps a tracked directory under `Automations/runs/<routine-id>/` (a `.gitkeep` holds it in Git).
- Local runs that pass `-EvidenceDirectory` write `run-<yyyyMMddTHHmmssfffZ>-<8-hex nonce>.json` records there (created with create-new semantics, so concurrent runs never overwrite each other); those local records are Git-ignored machine output.
- Scheduled GitHub Actions runs keep their durable evidence as a workflow artifact named in the registry entry's `evidence_artifact` field (for `maps-integrity-check`: `maps-integrity-check-evidence`, 90-day retention), next to the run log.
- Failure escalation for GitHub Actions routines is the failed-run notification GitHub sends the repository owner. The registry `failure_cap` is the owner's stop rule: after that many consecutive failed runs, disable the workflow in GitHub Actions until the cause is fixed.

Registered routines:
- `maps-integrity-check` — `.github/workflows/maps-integrity.yml`, daily at 06:17 UTC on `windows-latest`, also on every pull request and push to `main`.

Rules:
1. No invisible recurring automation is considered operational.
2. A run without evidence is not verified complete.
3. Repeated failures must stop or escalate rather than burn resources indefinitely.
4. Credentials and machine-specific secrets never belong in the registry.

## S — Screen
Goal: dashboards make the system legible without owning canonical truth.

Rules:
1. Screen reads canonical files, registries, APIs, and run evidence.
2. Screen may trigger an approved workflow, but durable state must be written by the owning system.
3. Dashboard-only state is non-authoritative.
4. If Screen disagrees with canonical data, canonical data wins and Screen is repaired.
5. Every operational status shown should be traceable to evidence.

## Required validation
Run:
```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\validate-maps.ps1"
```

A passing validation confirms structural integrity only: all seven signposts exist, every route in `MAPS.md` and `maps/` resolves, no map routes to a legacy placeholder folder (`SOPs/`, `Inbox/`), and every registry entry is complete with an existing evidence directory. It does not prove external credentials, remote machines, schedules, or integrations are live.

## Implementation order
Maintain MAPS in this order:
1. Memory routes and integrity
2. Agent controls and shared operating rules
3. Pulse registry and evidence
4. Screen projections and controls

This order prevents a dashboard from becoming a substitute for operational truth.
