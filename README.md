# Obsidian Life OS

A practical, maintainable Life OS built for Obsidian with native features first, consistent properties, reusable templates, and Bases-powered dashboards.

## Canonical Vault Structure

```text
00 Home/
01 Inbox/
10 Projects/
20 Areas/
30 Goals/
40 Resources/
50 People/
60 Reviews/
70 Journal/
80 SOPs/
90 Archive/
99 Templates/
```

Legacy folders remain temporarily so existing notes are not destroyed. New notes must use the numbered structure. Migrate legacy notes only after reviewing links and metadata.

## Operating Model

```text
Daily Notes
    ↓
Weekly Reviews
    ↓
Projects and Areas
    ↓
Goals and Life Direction
```

Personal growth follows a light loop:

```text
Notice → Weekly Check-In → One Small Action → Evidence
```

Business and AI work extends the loop:

```text
Projects → Decisions → SOPs → Agents → Experiments
```

## Start Here

1. Open this repository as an Obsidian vault.
2. Follow `docs/OBSIDIAN_SETUP.md`.
3. Open `00 Home/Life OS.md`.
4. Open `00 Home/Personal Growth Dashboard.md` for the growth system.
5. Create notes from `99 Templates/`.
6. Run `powershell -ExecutionPolicy Bypass -File scripts/audit-vault.ps1` after changes.

## Native Features

Enable these Obsidian core plugins:

- Templates
- Daily notes
- Properties view
- Bases
- Bookmarks
- Canvas

Community plugins are optional. Add Templater, QuickAdd, Tasks, Calendar, or Dataview only after a repeated limitation appears.

## Foundation Rules

- Every active project has one clear outcome, one next action, an owner, and a review date.
- Goals are measurable; projects contain the work.
- Areas are ongoing responsibilities, not finish-line outcomes.
- Personal growth uses honest evidence and self-reported states; the system does not invent scores.
- Capture into `01 Inbox/`, then process during daily or weekly review.
- Prefer Bases before Dataview.
- Do not automate an unstable workflow.

## Key Files

- `00 Home/Life OS.md` — main dashboard
- `00 Home/Personal Growth Dashboard.md` — personal growth home
- `20 Areas/Personal Growth.md` — growth standards and focus
- `30 Goals/Become My Best Self.md` — measurable growth goal
- `99 Templates/Personal Growth Check-In.md` — weekly growth review
- `00 Home/Bases/` — structured dashboards
- `99 Templates/` — canonical templates
- `architecture/METADATA_SCHEMA.md` — property contract
- `docs/OBSIDIAN_SETUP.md` — exact setup instructions
- `docs/LifeOS_Specification_v1.md` — operating specification
- `scripts/setup-obsidian.ps1` — non-destructive local setup
- `scripts/audit-vault.ps1` — structural and metadata validation
- `app/dashboard/page.tsx` — optional executive web dashboard
- `docs/EXECUTIVE_DASHBOARD.md` — dashboard architecture, registry, and validation

## Executive Web Dashboard

Run `npm install` and `npm run dev`, then open `/dashboard` for the Morning Brief, Prayer, Revenue Radar, AI Workforce, and GitHub Health widgets. Obsidian remains the canonical LifeOS interface; the web dashboard is an executive summary surface.

## Definition of Done

The vault is operational when it can answer these questions in under one minute:

- What deserves attention today?
- Which projects are active, blocked, waiting, or due for review?
- Which goals are progressing?
- What is my current personal growth focus and next action?
- Who needs follow-up?
- Which SOPs, decisions, and agents need review?
