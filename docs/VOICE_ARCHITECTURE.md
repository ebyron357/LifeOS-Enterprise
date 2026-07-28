# LifeOS Voice Architecture (Verbal + Audio V1)

**Status:** Code complete with browser fallback; provider credentials optional  
**Branch:** `feat/lifeos-verbal-audio-v1`  
**Started from:** `feat/lifeos-interactive-visual-v1` @ `646e67c`  
**Note:** Interactive Visual System V1 PR #38 was **not merged** to `main` at implementation time. This branch continues from that newest verified interactive tip. Production `main` remains `ae23a0b`.

## Architecture selected

Provider-abstracted stack:

```text
VoiceConsole (UI)
  ├─ XState voice machine (explicit states/transitions)
  ├─ Transport adapter (browser | livekit stub)
  ├─ Command parser (deterministic, locale-ready)
  ├─ Tool registry (read/write classification)
  └─ Temporary in-browser transcript (not vault-persisted)

Server:
  GET  /api/lifeos/voice/session  → ephemeral session metadata (no permanent keys)
  POST /api/lifeos/voice/tools   → validated tool execution
```

## Providers implemented

| Layer | V1 implementation |
|-------|-------------------|
| Realtime transport | Browser default; LiveKit adapter stub when env present |
| Speech-to-text | Web Speech Recognition API |
| Language model | Deterministic command parser (no free-form tool calling) |
| Text-to-speech | Web Speech Synthesis (existing brief path compatible) |
| Optional TTS vendors | Env placeholders only (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`) — not client-bundled |
| Presence | CSS abstract presence; optional Rive loader if asset provided |
| Waveform library | Not required for V1 replay (re-speak last utterance) |

## Security model

- Permanent provider keys never sent to the browser
- Write tools require `LIFEOS_WRITE_ENABLED` + `LIFEOS_WRITE_SECRET`
- Write actions require explicit confirmation UI + spoken confirm
- Staging only (`proposal-only`) — never direct `main`
- Rate limits on session + tool routes
- Transcripts marked temporary; no silent audio storage
- Wake-word / hands-free listening disabled

## Tool registry

Registered tools live in `lib/voice/tools.ts`. Only those tools may execute. Inputs are validated server-side for write tools and locally for read helpers.

## Accessibility

- Voice optional; dashboard works without mic/audio/credentials
- Keyboard: Alt+V push-to-talk, Esc stop
- Transcript always available with role labels
- Reduced-motion / high-contrast compatible presence + visualizer
- Overload mode still owned by cognitive support module

## Language preparation

`locale`, `transcriptionLanguage`, and `responseLanguage` support `en | ht | fr`. V1 phrases are English-first. Haitian Creole / French are **not claimed verified**.

## Failure / fallback order

1. Written UI (always)
2. Browser speech synthesis / recognition when available
3. LiveKit realtime when configured (token mint deferred until hardened)
4. Clear disabled/error states when unsupported

## Configuration required

See `.env.example`. Missing config must not break `/dashboard`.

## Status board

| Gate | Status |
|------|--------|
| Code complete | Yes |
| Tests complete | Yes (local) |
| Configuration required | Yes for LiveKit / write voice staging |
| Credentials required | Yes for production realtime + write auth |
| Provider validation required | Yes before claiming live LiveKit |
| Production verified | No |
