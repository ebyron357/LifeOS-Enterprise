# LifeOS Continuity / Resume Engine

**Implementation status:** Derived resume packages are live on the existing Command Center and Today surfaces. Governed checkpoint writes (`POST /api/lifeos/continuity/checkpoint`) are added on branch `claude/quirky-sagan-1m56r5` and are not production until merged and deployed.  
**System owner:** Continuity  
**Canonical storage:** Vault project/resource notes plus optional `type: checkpoint` records  
**Write model:** `GET /api/lifeos/continuity` stays read-only. Checkpoints are written only through `POST /api/lifeos/continuity/checkpoint`, which stages a draft PR and never writes to `main`.

## Purpose

Continuity removes the owner as the reconstruction layer after an interruption.

LifeOS now answers, from verified vault and GitHub evidence:

- Where was I?
- What was I doing?
- Why was I doing it?
- What was the desired outcome?
- What has happened since?
- What changed?
- What failed?
- What is blocked?
- Who owns each item?
- What can an agent continue?
- What actually needs the owner?
- What should happen next?

## Current flow

```text
Vault projects + Resource Intelligence records + canonical prompts + optional checkpoint notes + GitHub health
  → ownership / authority classification
  → one Resume Package
  → Command Center / Today / GET /api/lifeos/continuity / voice "where was I"
```

The engine does **not** create a second command center. It fills the previously hollow "Continue working / Ask LifeOS what to resume" gap.

## Cognitive firewall

Before a resume item is labeled **Needs you**:

1. Can an agent inspect, test, draft, or collect evidence?
2. Can existing policy decide it?
3. Is human judgment actually required (credentials, money, legal, merge, production, irreversible)?

If not, the item stays in **Agents can continue**.

Capture, GitHub health, and agent claims are never treated as done.

## Durable checkpoints

Use `99 Templates/Resume Checkpoint.md` and store records under `Command Center/Checkpoints/`.

The conversation-closeout skill already requires this checkpoint shape. This engine consumes those records when they exist and otherwise derives the same questions from live vault/GitHub state.

### Saving a checkpoint

The resume card on the Command Center and Today has a **Save this as a checkpoint** control. It calls `POST /api/lifeos/continuity/checkpoint`, which:

- is fail-closed behind the existing `LIFEOS_WRITE_ENABLED` + `LIFEOS_WRITE_SECRET` + `LIFEOS_GITHUB_TOKEN` gate, with the origin, rate-limit, and owner-secret checks running before any GitHub call;
- snapshots the current derived resume package and applies optional fields (`title`, `project`, `lastCompleted`, `currentState`, `nextAction`, `owner`, `blocker`, `sourceOfTruth`, `doNotRepeat`, `evidence`, `sessionStatus`);
- requires a next action;
- writes a new record under `Command Center/Checkpoints/` at a path that includes the date, project, and a per-request random nonce, so two concurrent saves never target the same file, and returns 409 rather than overwrite if the path somehow already exists;
- stages the record as a draft PR, using the same helper as Resource Intelligence (`lib/github/draft-pr.ts`).

Checkpoint frontmatter values are written as single-line, JSON-quoted strings. The vault frontmatter parser decodes them exactly, so values containing colons, quotes, or line breaks cannot corrupt the frontmatter. Line breaks inside a value are collapsed to spaces.

## Explicitly not claimed

- Slack / ClickUp / email / calendar reconstruction
- Semantic memory index (Graphiti/Cognee) — WATCH / ADAPT later as an index over vault Markdown
- LangGraph / Temporal runtime replacement
- Automatic disposition of Resource Intelligence items
- Owner-accepted voice/microphone quality
- Invented prompt success scores; Continuity only links Prompt Intelligence records when context matching is strong
