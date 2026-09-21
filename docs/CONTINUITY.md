# LifeOS Continuity / Resume Engine

**Implementation status:** Derived resume packages are live on the existing Command Center and Today surfaces.  
**System owner:** Continuity  
**Canonical storage:** Vault project/resource notes plus optional `type: checkpoint` records  
**Write model:** This slice is read-only. Checkpoint Markdown is durable when an agent or owner writes it through the existing draft-PR path.

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
Vault projects + Resource Intelligence records + optional checkpoint notes + GitHub health
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

Canonical writes of new checkpoint notes still use the existing draft-PR approval path. This slice does not add a new write API.

## Explicitly not claimed

- Slack / ClickUp / email / calendar reconstruction
- Semantic memory index (Graphiti/Cognee) — WATCH / ADAPT later as an index over vault Markdown
- LangGraph / Temporal runtime replacement
- Automatic disposition of Resource Intelligence items
- Owner-accepted voice/microphone quality
