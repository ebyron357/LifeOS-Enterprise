# LifeOS Enterprise v1.0 — Release Notes

**Version:** `1.0.0`  
**Date:** 2026-07-28  
**Canonical branch:** `main` @ `ef21fa16313a9f036b4c4083db9f8d76bddc65ab`  
**Release PR:** [#40](https://github.com/ebyron357/LifeOS-Enterprise/pull/40) (merged)  
**Superseded PRs:** [#38](https://github.com/ebyron357/LifeOS-Enterprise/pull/38), [#39](https://github.com/ebyron357/LifeOS-Enterprise/pull/39) (closed without merge)

## What’s in v1.0

| Capability | Status |
|------------|--------|
| Obsidian vault structure + audit | Production |
| Read-only web vault portal | Production |
| Executive dashboard + Command Center | Production |
| Workspace OS V1 | Production |
| Interactive Operations board (staging) | Production |
| Conflict-safe draft-PR persistence (V2) | Production (`draft-pr-only`, `directMainWrites: false`) |
| Command Map (Visual V1) | Production |
| Browser voice console (Verbal V1) | Production, **disabled until `LIFEOS_VOICE_ENABLED=true`** |

## Explicit V1 boundaries

- Canonical vault writes never go to `main` from the dashboard. Persistence creates **draft PRs** only.
- Voice does **not** enable LiveKit realtime in this release.
- `.env.example` defaults keep voice and writes off.
- Board/Map/Voice edits are **browser staging** until an authenticated draft PR is created.
- Haitian Creole and French voice locales are **not verified**.
- Rate limiting is in-memory (single-instance assumption).
- `npm audit` reports 13 known transitive vulnerabilities (accepted debt for v1.0).

## Canonical local clone

Release engineering used:

`C:\Users\Admin\Desktop\LifeOS-Enterprise`

The Desktop folder `LifeOS-Enterprise-main` is a **non-git extract** and is **not authoritative**.

## Production observations (2026-07-28)

| Check | Result |
|-------|--------|
| Production domain | `https://lifeos-enterprise.vercel.app` |
| Deploy commit | `ef21fa1` |
| Voice session API | `configured:false`, `provider:none` |
| Voice UI | Shows “Voice disabled”; push-to-talk absent |
| Change-plan GET | `directMainWrites:false`, `mode:draft-pr-only`, `configured:false` |
| Change-plan POST (no/invalid auth) | `401 Unauthorized` |
| Dashboard markers | Command Board, Command Map, Workspace, Command Center present |

Note: production currently reports `LIFEOS_WRITE_ENABLED=true` while remaining **not fully configured** (`LIFEOS_GITHUB_TOKEN` absent → `configured:false`). Unauthenticated writes fail. Prefer setting `LIFEOS_WRITE_ENABLED=false` in Vercel unless draft-PR writes are intentionally activated with secret + GitHub token.

## Upgrade / activation order

1. Confirm production deploy matches `main` tip.
2. Prefer `LIFEOS_WRITE_ENABLED=false` unless intentionally enabling draft-PR writes.
3. To enable browser voice: set `LIFEOS_VOICE_ENABLED=true` (optionally `LIFEOS_VOICE_SESSION_SECRET`).
4. Only then set write secret + GitHub token if draft-PR persistence is desired.

## Rollback

1. Redeploy the previous Vercel production deployment for `main`, **or**
2. Revert merge commit `ef21fa1` via a new PR.
3. Close any draft change-plan PRs opened after write enablement.

## Validation evidence

- `npm ci` — pass
- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test` — **87/87** pass
- `npm run build` — Next.js 16.1.6 pass
- `pwsh ./scripts/audit-vault.ps1` — PASS
- Dashboard CI on `main` @ `ef21fa1` — success
- Vault Health on `main` @ `ef21fa1` — success
- Vercel Production deploy @ `ef21fa1` — success
