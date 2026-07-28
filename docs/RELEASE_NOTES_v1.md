# LifeOS Enterprise v1.0 — Release Notes

**Release candidate:** `1.0.0`  
**Date:** 2026-07-28  
**Canonical branch:** `main` (after merge of `release/v1.0-visual-voice-integration`)

## What’s in v1.0

| Capability | Status |
|------------|--------|
| Obsidian vault structure + audit | Production |
| Read-only web vault portal | Production |
| Executive dashboard + Command Center | Production |
| Workspace OS V1 | Production |
| Interactive Operations board (staging) | Production |
| Conflict-safe draft-PR persistence (V2) | Production, **writes default-deny** |
| Command Map (Visual V1) | Production |
| Browser voice console (Verbal V1) | Production, **opt-in via env** |

## Explicit V1 boundaries

- Canonical vault writes never go to `main` from the dashboard. Persistence creates **draft PRs** only.
- Voice does **not** enable LiveKit realtime in this release.
- Voice and write services are **off by default** in `.env.example`.
- Board/Map/Voice edits are **browser staging** until an authenticated draft PR is created.

## Upgrade notes

1. Merge `release/v1.0-visual-voice-integration` (or the release PR) into `main`.
2. Deploy with existing Vercel project settings.
3. Confirm `LIFEOS_WRITE_ENABLED=false` in production unless intentionally enabling draft-PR writes.
4. To enable browser voice: set `LIFEOS_VOICE_ENABLED=true`.
5. Optional: set `LIFEOS_VOICE_SESSION_SECRET` for HMAC-signed voice tool read auth.

## Rollback

1. Redeploy the previous Vercel production deployment, **or**
2. Revert the release merge commit via a new PR.
3. Close draft change-plan PRs if any were opened after write enablement.

## Validation evidence (integration branch)

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test` — 84+ tests pass
- `npm run build` — Next.js 16.1.6 production build pass
- `pwsh -File ./scripts/audit-vault.ps1` — PASS
