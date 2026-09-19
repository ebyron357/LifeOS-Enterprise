# LifeOS Enterprise — Production Deployment Guide

## Prerequisites

- Node.js 20+ (CI uses current LTS)
- npm (lockfile committed — use `npm ci` in CI/CD)
- Dashboard CI runs lint, typecheck, unit tests, build, and Playwright
- Obsidian for vault editing (optional for web-only ops)
- GitHub repo access for draft-PR persistence (optional until writes are enabled)
- Vercel project linked to `ebyron357/LifeOS-Enterprise` (existing)

## Canonical repository

- GitHub: `https://github.com/ebyron357/LifeOS-Enterprise`
- Default branch: `main`
- Canonical local clone for release work: `C:\Users\Admin\Desktop\LifeOS-Enterprise`
- Do **not** treat `LifeOS-Enterprise-main` Desktop extracts as source of truth (non-git copies)

## Current release state

- Current repository `main`: `7982c92a7080f60f9fb70e7c66c5220b8178bc35` (PR #64 performance/dependency hardening)
- Last production deployment verified READY during the 2026-09-19 reconciliation: `dpl_Ew6Ttwi7p6XynLw9VPqMKUdu6Rnd` at `6f6d5d7578c03b89abe781cc11351ad66cb07c51`
- A production deployment for `7982c92a7080f60f9fb70e7c66c5220b8178bc35` was triggered automatically. Treat production identity as unchanged until that deployment reports READY.
- `docs/CANONICAL_LIVE_STATUS.md` is authoritative for current deployment identity and owner-acceptance state.

## Environment variables

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `LIFEOS_WRITE_ENABLED` | No | `false` — keep false unless enabling draft-PR writes |
| `LIFEOS_WRITE_SECRET` | If writes on | Shared bearer for change-plan, conversation approvals, and optional paid TTS |
| `LIFEOS_GITHUB_TOKEN` | If writes on | Fine-grained token with contents + PR create |
| `LIFEOS_ALLOWED_ORIGIN` | Recommended if writes on | Exact dashboard origin |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | If writes/approvals on | Shared durable approval + nonce store for Vercel. Missing store fails closed |
| `LIFEOS_APPROVAL_STORE` | No | Leave empty in production. `memory` is explicit local/test only. `none` forces unavailable |
| `LIFEOS_TTS_SECRET` | If paid TTS on | Owner bearer required before spending `OPENAI_API_KEY`. Voice-session tokens are rejected. If empty, `LIFEOS_WRITE_SECRET` is accepted |
| `LIFEOS_VOICE_ENABLED` | No | `false` — set `true` for browser voice console |
| `LIFEOS_VOICE_BROWSER_FALLBACK` | No | `true` |
| `LIFEOS_VOICE_SESSION_SECRET` | Optional | Enables HMAC voice session tokens |
| `REVENUE_SHEET_ID` / Google SA | Optional | Revenue Radar |
| `LIVEKIT_*` | Optional | Reserved; room tokens are not minted |
| `LIFEOS_AGENT_LLM_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | Optional | Server-side LLM rewrite and OpenAI TTS when configured; tools still go through the policy engine |
| `CLICKUP_API_TOKEN` / `CLICKUP_LIST_ID` / `SLACK_BOT_TOKEN` / `SLACK_DEFAULT_CHANNEL` / `N8N_WEBHOOK_URL` / `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `SUPABASE_SERVICE_ROLE_KEY` | Optional | Adapter execution only when complete; unconfigured tools stay **unavailable** (never shown as connected) |

Owner acceptance workbook: `docs/OWNER_ACCEPTANCE_WORKBOOK.md`.

Never commit `.env.local` or real secrets.

## Deploy steps (Vercel)

1. Ensure `main` is green (Dashboard CI + Vault Health).
2. Vercel production deploy from `main` (auto on push, or promote preview).
3. Verify `/` loads the unified Command Center, then verify `/dashboard` loads the advanced Board/Map workspace and (if enabled) Voice console.
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

## Rollback procedure

1. Identify the exact currently active READY production deployment in Vercel before changing anything.
2. If a new production deployment fails build or runtime verification, leave the previous READY production deployment active; do not describe the failed candidate as live.
3. If a newly READY production deployment must be undone, use Vercel rollback/promote controls to restore the previous known-good READY production deployment.
4. If the defect came from a merged GitHub change, create a normal revert/fix pull request; do not rewrite `main` history.
5. Re-run Dashboard CI, Vault Health, production smoke checks, and any affected owner-acceptance rows before calling the rollback/fix complete.
6. Record the resulting deployment ID and Git SHA in `docs/CANONICAL_LIVE_STATUS.md`.

Exact production SHA is recorded only after a verified READY production deployment of that SHA.

## Production checklist

- [ ] `LIFEOS_WRITE_ENABLED=false` unless intentionally enabling
- [ ] No client-side GitHub tokens
- [ ] Dashboard CI green on release commit
- [ ] Vault Health green on release commit
- [ ] `/dashboard` responsive at 1440 / 1024 / 390
- [ ] Widget Library, Repair Layout, and mobile reorder verified
- [ ] Game loop XP awards only on attested completions
- [ ] Conversation mute stops microphone capture
- [ ] Screen share cleanup on Stop / navigate away
- [ ] Approvals enforced server-side with owner write secret (not browser indicator or voice-session token)
- [ ] Durable approval storage configured before enabling writes; missing store fails closed
- [ ] Server TTS origin + owner authorization + 2000-character limit verified; `provider: "browser"` does not call OpenAI
- [ ] Reduced-motion / overload modes still usable
- [ ] Owner acceptance workbook completed by owner
- [ ] Rollback path known (previous Vercel deployment)

## Test instructions

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
pwsh -NoProfile -File ./scripts/audit-vault.ps1
npm audit --audit-level=high
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

Playwright viewports: 1440 (desktop), 1024 (laptop), 390 (mobile). Vault audit covers required folders, metadata, and internal link checks.

## Security posture (operational closeout)

- Reads: vault markdown via server components / APIs (no permanent provider keys in browser)
- Writes: draft PR only; path allowlists; canonical conflict detection (409); never direct `main`
- Agent approvals: authoritative durable records with expiry, nonce/replay protection, session + project + repository + path + revision binding. Execution uses stored args, not the summary. Production storage is Upstash Redis REST or fail-closed
- Voice: server TTS only with origin checks, owner/TTS secret, trusted rate-limit identity, and a 2000-character limit; `provider: "browser"` returns immediately; mute aborts recognition; new speech interrupts TTS; hold-to-talk flushes on release; HMAC sessions when secret configured; no LiveKit readiness claim
- Prefer `LIFEOS_WRITE_ENABLED=false` in Vercel unless draft-PR writes are intentionally active with secret + GitHub token
- Historical production smoke (2026-07-28): voice disabled; change-plan POST without valid bearer returned `401`; `directMainWrites:false`
- PR #64 validation (2026-09-18): 54 test files / 298 tests passed, typecheck/lint/build passed, vault audit passed, and `npm audit --audit-level=high` reported 0 vulnerabilities before merge

## Known limitations

- LiveKit room-token minting deferred (browser speech only)
- Haitian Creole / French voice locales not verified
- In-memory rate limiting remains process-local and is not shared across serverless instances
- Live microphone/screen-share quality and permission behavior still require owner testing on real browsers/devices
- Resource Intelligence remains a post-V1 platform build item until its durable intake/classification/disposition workflow is implemented end to end
