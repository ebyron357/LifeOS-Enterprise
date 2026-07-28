# LifeOS Enterprise — Production Deployment Guide

## Prerequisites

- Node.js 20+ (CI uses current LTS)
- npm (lockfile committed — use `npm ci` in CI/CD)
- Obsidian for vault editing (optional for web-only ops)
- GitHub repo access for draft-PR persistence (optional until writes are enabled)
- Vercel project linked to `ebyron357/LifeOS-Enterprise` (existing)

## Environment variables

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `LIFEOS_WRITE_ENABLED` | No | `false` — keep false unless enabling draft-PR writes |
| `LIFEOS_WRITE_SECRET` | If writes on | Shared bearer for change-plan + voice write staging |
| `LIFEOS_GITHUB_TOKEN` | If writes on | Fine-grained token with contents + PR create |
| `LIFEOS_ALLOWED_ORIGIN` | Recommended if writes on | Exact dashboard origin |
| `LIFEOS_VOICE_ENABLED` | No | `false` — set `true` for browser voice console |
| `LIFEOS_VOICE_BROWSER_FALLBACK` | No | `true` |
| `LIFEOS_VOICE_SESSION_SECRET` | Optional | Enables HMAC voice session tokens |
| `REVENUE_SHEET_ID` / Google SA | Optional | Revenue Radar |
| `LIVEKIT_*` | Optional | Reserved; V1 does not mint room tokens |

Never commit `.env.local` or real secrets.

## Deploy steps (Vercel)

1. Ensure `main` is green (Dashboard CI + Vault Health).
2. Vercel production deploy from `main` (auto on push, or promote preview).
3. Verify `/dashboard` loads Command Center, Board/Map switch, and (if enabled) Voice console.
4. Confirm change-plan panel shows writes disabled unless intentionally configured.
5. Run vault audit locally after vault content changes:
   ```powershell
   pwsh -NoProfile -File ./scripts/audit-vault.ps1
   ```

## Local development

```powershell
npm ci
# copy .env.example -> .env.local and set LIFEOS_VOICE_ENABLED=true for voice
npm run dev
```

Validation:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
pwsh -NoProfile -File ./scripts/audit-vault.ps1
```

## Production checklist

- [ ] `LIFEOS_WRITE_ENABLED=false` unless intentionally enabling
- [ ] No client-side GitHub tokens
- [ ] Dashboard CI green on release commit
- [ ] Vault Health green on release commit
- [ ] `/dashboard` responsive at desktop and ~390px width
- [ ] Reduced-motion / overload modes still usable
- [ ] Rollback path known (previous Vercel deployment)

## Security posture (v1.0)

- Reads: vault markdown via server components / APIs (no permanent provider keys in browser)
- Writes: default-deny; draft PR only; path allowlists; canonical conflict detection (409)
- Voice: opt-in; browser speech; HMAC sessions when secret configured; no LiveKit readiness claim
