# LifeOS Interactive Agent Runtime

**Status:** The interactive runtime is merged on current `main`. PR #61 hardened write authorization/durable approvals, PR #62 integrated the unified Command Center, and PR #64 added performance/dependency hardening without changing the approval model.  
**Application-code baseline:** `7982c92a7080f60f9fb70e7c66c5220b8178bc35` (PR #64); query GitHub/Vercel for live repository/deployment identity  
**Workspace:** Conversation page at `/conversation` inside the existing vault portal  
**Owner acceptance:** not complete. Automated success is not owner acceptance.

This document is the current-state architecture for conversational voice, screen awareness, the agent runtime, tools, approvals, teaching, and session persistence. It extends LifeOS V1. It does not replace Voice V1, Workspace OS, Daily Brief, Portfolio, or ChangePlanPersistence.

## Architecture

```text
LifeOS Agent Runtime
    |
    +-- Conversation Layer          /conversation + existing VoiceConsole
    |
    +-- Voice Adapter               lib/voice/provider.ts + lib/voice/conversation.ts
    |
    +-- Screen Context Adapter      lib/screen/state.ts + lib/screen/browser.ts
    |
    +-- LifeOS Context Resolver     vault dashboard data fetched server-side
    |
    +-- Tool Registry               lib/agent/tools/registry.ts
    |
    +-- Approval / Policy Engine    lib/agent/policy.ts
    |
    +-- Execution Engine            lib/agent/runtime.ts
    |
    +-- Teaching / Learning Layer   lib/agent/teaching.ts
    |
    +-- Evidence / Activity Log     lib/agent/activity.ts
```

Provider boundary:

- Tier A: browser Web Speech (continuous conversation or push-to-talk).
- Tier B: LiveKit / OpenAI-compatible realtime remain adapters only. Room tokens are still not minted. LLM keys stay server-side and never change tool policy.

## Voice

Persistent conversation session states: idle, connecting, listening, thinking, speaking, muted, error, permission-denied, stopped.

Mute calls `stopListening()`, which **aborts** recognition and clears handlers so leftover finals cannot submit. Interrupt cancels server audio and `speechSynthesis`.

Owner controls: start, stop, mute, unmute, interrupt, resume, push-to-talk, clear transcript, transcript privacy.

Audio is not recorded. Transcripts are ephemeral browser memory. Existing Command Center `VoiceConsole` remains for V1 command mode.

## Screen awareness

Owner must click **Share Screen**. Capture uses `navigator.mediaDevices.getDisplayMedia()`. The returned requesting snapshot is applied to the visible UI before the browser picker settles, then grant, deny, stop, pause, or end replace it. Generation tokens still discard stale callbacks and stop leftover tracks.

The agent may use verified metadata: requesting/sharing/paused/denied/ended/unsupported, source name, size, capture age, paused/stale/denied.

It must not invent pixels. If analysis is paused, the snapshot is stale, or permission ended, it says so.

Frames stay in the browser video element. They are not stored.

Manual verification: Playwright cannot grant display-media permission. Confirm Share Screen once in a real browser.

## Agent runtime and tools

`POST /api/lifeos/agent/turn` fetches live vault data on the server, sanitizes untrusted text, selects tools, and applies the policy engine.

Read tools may run automatically when configured.

Reversible tools stage proposals and require approval by default.

High-risk tools (merge, deploy, Slack, email, billing, permission changes, destructive database) always require approval and do not run when unconfigured.

`POST /api/lifeos/agent/approval` is an owner-write route. It requires `LIFEOS_WRITE_ENABLED=true` and `LIFEOS_WRITE_SECRET`. A public voice-session token from `GET /api/lifeos/voice/session` cannot approve or execute Slack, ClickUp, n8n, Vercel, GitHub, or other external actions. Anonymous callers are rejected. Read-only turns and conversation remain on the existing read policy.

Approvals and nonces are stored in shared durable storage (Upstash Redis REST). Process-local Maps are not used in production. If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are missing, write/approval execution fails closed and the integration is reported unavailable. `LIFEOS_APPROVAL_STORE=memory` is an explicit test/local opt-in, not a silent production fallback.

Approved tools execute the immutable server-stored `args` that the owner reviewed. The approval summary is display copy only. Slack receives `args.message`/`args.text`. ClickUp receives `args.name` and `args.description`. n8n receives `args.payload`. Vercel receives only a validated `args.target` of `production`. The Conversation approval panel shows those arguments next to Approve.

Canonical metadata changes still use:

ChangePlanPersistence → draft change plan → draft pull request → human review

## Session persistence

| Data | Class |
| --- | --- |
| Microphone audio, screen frames, live transcript | ephemeral |
| Screen-share UI state, activity, pending approvals | browser-local |
| HMAC session token | server-session |
| Workspace layout, daily brief records | browser-local |
| Vault notes and GitHub `main` | canonical |

## Security

- Microphone and screen capture require explicit owner gestures.
- Provider keys never ship to the browser.
- Same-origin checks and rate limits on agent routes.
- Prompt-injection sanitization before tool use.
- No secret logging.
- Approvals are server-authoritative records with expiry, nonce/replay protection, session/project/repository binding, path allowlists, and revision binding. A browser Approve indicator cannot authorize a write by itself. Replay is rejected across serverless instances when durable storage is configured.
- Owner write authorization is the same gate as change-plan persistence: `LIFEOS_WRITE_ENABLED` plus `LIFEOS_WRITE_SECRET`. Voice-session tokens are not write credentials.
- Rejection means no execution.
- Pause/stop halt further work.
- Existing change-plan, voice, and vault privacy boundaries are unchanged.

## Observability

Structured events: session start/stop, screen share start/stop, mission start/complete, tool invoke/result, approval requested/accepted/rejected, recoverable and terminal errors.

Not logged: secrets, tokens, raw transcripts by default, raw screen captures.

## Owner usage

See `80 SOPs/LifeOS Owner's Operating Manual.md` → **How to Use Interactive LifeOS**.

## Rollback

1. Treat the current runtime as part of `main`; there is no separate corrective branch to preserve or revive.
2. If a runtime regression is introduced, revert or repair it through a new reviewable pull request; do not rewrite `main` history.
3. Keep canonical project writes draft-PR-only and keep approval execution fail-closed during rollback/recovery.
4. Use Vercel's previous known-good READY deployment if a production rollback is required, and record the exact deployment/SHA in that operation's release or acceptance evidence.
5. PRs #55 and #59 remain closed/superseded and are not continuation or rollback sources.

## Known limitations

- Continuous browser speech quality varies by browser. Hold-to-talk is the fallback; release flushes the last utterance.
- LiveKit room tokens are still deferred.
- Optional LLM rewrite is not used unless a server-side key exists, and even then tools stay policy-gated.
- ClickUp, Slack, n8n, Vercel, and Supabase adapters stay unavailable until their env placeholders are set **and** durable approval storage is configured; credential presence alone is not reported as verified connectivity.
- Production write/approval execution is unavailable until Upstash Redis REST is configured. There is no silent in-memory production store.
- Screen-share permission cannot be granted by Playwright.
- Voice production polish and real-device acceptance remain tracked separately; automated tests do not replace owner microphone/playback verification.
