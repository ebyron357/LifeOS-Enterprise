# LifeOS Interactive Agent Runtime

**Status:** Implemented on `feat/lifeos-interactive-agent-runtime`  
**Baseline:** `main` @ `9895c4a805032f677a9acb90e4747669ed92bfc4`  
**Workspace:** Conversation page at `/conversation` inside the existing vault portal

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

Persistent conversation session states: idle, connecting, listening, thinking, speaking, muted, error, stopped.

Owner controls: start, stop, mute, unmute, interrupt, resume, push-to-talk, clear transcript, transcript privacy.

Audio is not recorded. Transcripts are ephemeral browser memory. Existing Command Center `VoiceConsole` remains for V1 command mode.

## Screen awareness

Owner must click **Share Screen**. Capture uses `navigator.mediaDevices.getDisplayMedia()`.

The agent may use verified metadata: sharing on/off, source name, size, capture age, paused/stale/denied.

It must not invent pixels. If analysis is paused, the snapshot is stale, or permission ended, it says so.

Frames stay in the browser video element. They are not stored.

Manual verification: Playwright cannot grant display-media permission. Confirm Share Screen once in a real browser.

## Agent runtime and tools

`POST /api/lifeos/agent/turn` fetches live vault data on the server, sanitizes untrusted text, selects tools, and applies the policy engine.

Read tools may run automatically when configured.

Reversible tools stage proposals and require approval by default.

High-risk tools (merge, deploy, Slack, email, billing, permission changes, destructive database) always require approval and do not run when unconfigured.

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
- Rejection means no execution.
- Pause/stop halt further work.
- Existing change-plan, voice, and vault privacy boundaries are unchanged.

## Observability

Structured events: session start/stop, screen share start/stop, mission start/complete, tool invoke/result, approval requested/accepted/rejected, recoverable and terminal errors.

Not logged: secrets, tokens, raw transcripts by default, raw screen captures.

## Owner usage

See `80 SOPs/LifeOS Owner's Operating Manual.md` → **How to Use Interactive LifeOS**.

## Rollback

1. Do not merge the feature branch.
2. If already preview-deployed, keep production on current `main`.
3. Revert the branch or close the PR.
4. No vault schema change is required. No GitHub Project change is required.

## Known limitations

- Continuous browser speech quality varies by browser. Push-to-talk is the fallback.
- LiveKit room tokens are still deferred.
- Optional LLM rewrite is not used unless a server-side key exists, and even then tools stay policy-gated.
- ClickUp, Slack, n8n, Vercel, and Supabase adapters stay unavailable until their env placeholders are set.
- Screen-share permission cannot be granted by Playwright.
