# LifeOS Voice Architecture (Verbal + Audio V1)

**Status:** Production-ready for browser speech (opt-in)  
**Release:** LifeOS Enterprise v1.0  
**Integration branch:** `release/v1.0-visual-voice-integration` (onto `main` after Workspace OS + Ops V2)

## Architecture

```text
VoiceConsole (UI)
  ├─ XState voice machine (explicit states/transitions)
  ├─ Browser speech transport (Web Speech API)
  ├─ Command parser (deterministic, locale-ready)
  ├─ Tool registry (read/write classification)
  └─ Temporary in-browser transcript (not vault-persisted)

Server:
  GET  /api/lifeos/voice/session  → ephemeral HMAC session metadata (no permanent keys)
  POST /api/lifeos/voice/tools   → validated tool execution

Command Board:
  listens for `lifeos-voice-staged-change` and applies browser drafts
```

## Providers implemented

| Layer | V1 implementation |
|-------|-------------------|
| Realtime transport | Browser only |
| Speech-to-text | Web Speech Recognition API |
| Language model | Deterministic command parser (no free-form tool calling) |
| Text-to-speech | Web Speech Synthesis |
| LiveKit | Credentials may be present; **room tokens are not minted**; provider is **not** advertised as ready |
| Presence | CSS abstract presence |

## Security model

- `LIFEOS_VOICE_ENABLED=true` required to enable the console
- Permanent provider keys never sent to the browser
- When `LIFEOS_VOICE_SESSION_SECRET` is set, session tokens are HMAC-signed with 1-hour expiry
- Write tools require `LIFEOS_WRITE_ENABLED` + `LIFEOS_WRITE_SECRET`
- Write actions require explicit confirmation UI + spoken confirm
- Staging only (`proposal-only`) — never direct `main`
- Voice staging events update the Command Board approval package in-browser
- Rate limits on session + tool routes
- Transcripts marked temporary; no silent audio storage
- Wake-word / hands-free listening disabled

## Accessibility

- Voice optional; dashboard works without mic/audio/credentials
- Keyboard: Alt+V push-to-talk, Esc stop
- Transcript always available with role labels
- Reduced-motion / high-contrast compatible presence + visualizer

## Language preparation

`locale`, `transcriptionLanguage`, and `responseLanguage` support `en | ht | fr`. V1 phrases are English-first. Haitian Creole / French are **not claimed verified**.

## Failure / fallback order

1. Written UI (always)
2. Browser speech when `LIFEOS_VOICE_ENABLED=true` and Web Speech is available
3. Clear disabled/error states when unsupported

## Configuration

See `.env.example` and `docs/DEPLOYMENT.md`.
