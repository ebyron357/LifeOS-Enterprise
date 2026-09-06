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

## Rollback procedure

1. Do **not** merge the post-#60 security corrective draft PR if acceptance fails.
2. Do **not** deploy the corrective branch. Production remains the current `main` deployment (`c7d4e3507d7837e100a35a9eacb903e9319f1803` includes merged PR #60).
3. To abandon the corrective: close the draft PR. No `main` revert is required.
4. If a preview or mistaken promote must be undone: in Vercel, roll back to the previous Ready production deployment (last known `main` SHA).
5. If this corrective is merged in error: revert the merge with a new PR; delete isolated change-plan branches if any were created.
6. PR #59 stays closed and superseded. Do not revive it.

Exact production SHA is recorded only after a verified production deploy of that SHA.

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
- Production smoke (2026-07-28): voice disabled; change-plan POST without valid bearer returns `401`; `directMainWrites:false`

## Known limitations

- LiveKit room-token minting deferred (browser speech only)
- Haitian Creole / French voice locales not verified
- In-memory rate limiting (not shared across serverless instances)
- 13 known transitive `npm audit` vulnerabilities remain accepted technical debt
- Interactive Visual (#38) and Voice (#39) stacked PRs were superseded by release PR #40
