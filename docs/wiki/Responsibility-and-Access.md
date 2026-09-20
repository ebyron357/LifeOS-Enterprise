# Responsibility and Access Document

No credentials appear in this document. It lists **account types, variable names
and purposes** only. Real values belong in Vercel environment variables or a
local `.env.local`, which must never be committed.

## 1. Ownership

| Item | Value | Evidence |
|------|-------|----------|
| Repository owner / operator | `ebyron357` | hard-coded as `OWNER` in `app/api/lifeos/change-plan/route.ts`; `docs/DEPLOYMENT.md` |
| Canonical repository | `https://github.com/ebyron357/LifeOS-Enterprise` | `docs/DEPLOYMENT.md` |
| Canonical branch | `main` | `docs/DEPLOYMENT.md` |
| Production URL | `https://lifeos-enterprise.vercel.app/` | `docs/CANONICAL_LIVE_STATUS.md` |
| Released version | `1.0.0` | `docs/CANONICAL_LIVE_STATUS.md`, `package.json` |
| Owner acceptance | **Not complete** — `docs/OWNER_ACCEPTANCE_WORKBOOK.md` outstanding | `docs/CANONICAL_LIVE_STATUS.md` |

The repository defines a single-owner model. There is no role or permission
system inside the application; authority is the GitHub repository permission plus
possession of the owner write secret.

## 2. Hosting and infrastructure

| Function | Provider | Notes |
|----------|----------|-------|
| Web hosting / production deploys | **Vercel**, project `lifeos-enterprise` | Auto-deploy from `main`; also the rollback surface |
| Source of truth, CI, draft PRs | **GitHub**, `ebyron357/LifeOS-Enterprise` | Dashboard CI (ubuntu) and Vault Health (windows) |
| Local editing | **Obsidian** on the owner's machine | `.obsidian/` is local-only and git-ignored; shared defaults live in `config/obsidian` |
| Durable approval/nonce store | **Upstash Redis (REST)** | Required before enabling writes; absence fails closed |

Machine-specific note from `docs/DEPLOYMENT.md`: the canonical local clone for
release work is `C:\Users\Admin\Desktop\LifeOS-Enterprise`. Non-git
`LifeOS-Enterprise-main` extracts must not be treated as source of truth.

## 3. Accounts required to *run* the product

These are the minimum for the read-only production experience.

| Account | Purpose | Env vars |
|---------|---------|----------|
| GitHub account with repo access | Source of truth, CI, deploy trigger | — |
| Vercel account linked to the repo | Build and host the Next.js app | — (project settings) |

Nothing else is required. With no optional credentials configured, the app runs
read-only and every integration reports *unavailable*.

## 4. Accounts required to *enable writes*

| Account / service | Purpose | Env vars |
|---|---|---|
| GitHub fine-grained token | Create branches, commit, open draft PRs (contents + pull request create) | `LIFEOS_GITHUB_TOKEN` |
| Owner-held shared secret (self-issued) | Bearer for change-plan, approvals, optional paid TTS | `LIFEOS_WRITE_SECRET` |
| — (config flag) | Master enable for governed writes; keep `false` otherwise | `LIFEOS_WRITE_ENABLED` |
| — (config value) | Exact allowed dashboard origin | `LIFEOS_ALLOWED_ORIGIN` |
| Upstash account | Durable approval + nonce storage on Vercel | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| — (config flag) | Store selection; leave empty in production (`memory` = local/test only, `none` = force unavailable) | `LIFEOS_APPROVAL_STORE` |

## 5. Optional accounts by capability

| Capability | Account | Env vars | State without it |
|---|---|---|---|
| Voice console (browser speech) | none | `LIFEOS_VOICE_ENABLED`, `LIFEOS_VOICE_BROWSER_FALLBACK`, `LIFEOS_VOICE_LOCALE`, `LIFEOS_VOICE_TRANSCRIPTION_LANGUAGE`, `LIFEOS_VOICE_RESPONSE_LANGUAGE` | Console hidden |
| Voice session HMAC tokens | none | `LIFEOS_VOICE_SESSION_SECRET` | Unsigned sessions |
| Paid server text-to-speech | **OpenAI** | `OPENAI_API_KEY` + `LIFEOS_TTS_SECRET` (or `LIFEOS_WRITE_SECRET`) | Browser TTS only; voice-session tokens can never spend the key |
| Server-side LLM rewrite | **OpenAI** and/or **OpenRouter** | `LIFEOS_AGENT_LLM_API_KEY`, `LIFEOS_AGENT_LLM_BASE_URL`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY` | Deterministic behaviour, no LLM call |
| Revenue Radar | **Google Cloud service account** + Google Sheet | `REVENUE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Safe empty state |
| Task execution | **ClickUp** | `CLICKUP_API_TOKEN`, `CLICKUP_LIST_ID` | Unavailable |
| Messaging | **Slack** (bot app) | `SLACK_BOT_TOKEN`, `SLACK_DEFAULT_CHANNEL` | Unavailable |
| Workflow automation | **n8n** instance | `N8N_WEBHOOK_URL` | Unavailable |
| LifeOS-triggered deploys | **Vercel** API token | `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_PROJECT_NAME` | Unavailable (production itself still deploys normally) |
| Reserved data backend | **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | Unused |
| Realtime voice transport | **LiveKit** | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Reserved; room tokens are not minted |
| Delegated agent runtime | **Hermes** endpoint | `HERMES_ENDPOINT`, `HERMES_TOKEN` | Adapter contract only, no connection claimed |

All external execution tools additionally require durable approval storage to be
configured; without it they stay unavailable regardless of their own credentials.

## 6. Secret-handling rules enforced by the repo

- Never commit `.env.local` or real secrets (`.env.example` header,
  `docs/DEPLOYMENT.md`).
- `.env`, `.env.example`, `.env.local`, `.env.production` and credential file
  extensions (`.pem`, `.key`, `.p12`, `.pfx`, `.crt`) are excluded from the web
  portal index (`lib/vault/exclusions.ts`).
- No provider keys are exposed to the browser; LLM keys are server-side only.
- Voice-session tokens are explicitly rejected as authorisation for paid TTS.
- `.obsidian/` is git-ignored so machine-specific plugin state never conflicts.

## 7. Offboarding / handover checklist

1. Transfer the GitHub repository (or add the new owner with admin rights).
2. Transfer or recreate the Vercel project and re-enter environment variables.
3. Rotate `LIFEOS_WRITE_SECRET`, `LIFEOS_TTS_SECRET`,
   `LIFEOS_VOICE_SESSION_SECRET`, and revoke the old `LIFEOS_GITHUB_TOKEN`.
4. Rotate or transfer Upstash, OpenAI/OpenRouter, Google service account,
   ClickUp, Slack, n8n and Vercel API credentials as applicable.
5. Update the hard-coded `OWNER`/`REPO` constants in
   `app/api/lifeos/change-plan/route.ts` and the repository references in
   `docs/DEPLOYMENT.md` and `docs/CANONICAL_LIVE_STATUS.md`.
6. Re-run Dashboard CI, Vault Health, and the owner acceptance workbook.
