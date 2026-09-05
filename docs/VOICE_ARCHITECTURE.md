# LifeOS Voice Architecture (Verbal + Audio V1)

**Status:** Browser speech remains the V1 path. Server OpenAI TTS is optional and owner-authorized. Owner acceptance is still required.  
**Release:** LifeOS Enterprise v1.0 plus post-#60 voice hardening on a draft corrective PR  
**Integration branch:** current `main` includes PR #60; paid-TTS and write-auth hardening ride the post-#60 corrective draft PR

Persistent conversational voice now also lives in `/conversation`. That layer reuses this transport and state machine. See `docs/INTERACTIVE_AGENT_RUNTIME.md`. The Command Center `VoiceConsole` remains the V1 command console.

## Architecture

```text
VoiceConsole (UI)
  ├─ XState voice machine (explicit states/transitions)
  ├─ Browser speech transport (Web Speech API)
  ├─ Command parser (deterministic, locale-ready)
  ├─ Tool registry (read/write classification)
  └─ Temporary in-browser transcript (not vault-persisted)

Server:
  GET  /api/lifeos/voice/session  → ephemeral HMAC session metadata (no permanent keys; not a write or paid-TTS credential)
  POST /api/lifeos/voice/tools   → validated tool execution
  POST /api/lifeos/voice/speak  → optional OpenAI TTS; browser provider returns immediately without spending a key

Command Board:
  listens for `lifeos-voice-staged-change` and applies browser drafts
```

## Providers implemented

| Layer | Implementation |
|-------|----------------|
| Realtime transport | Browser recognition + optional server TTS |
| Speech-to-text | Web Speech Recognition API |
| Language model | Deterministic command parser / agent runtime (policy-gated) |
| Text-to-speech | Server OpenAI TTS only when the owner selects OpenAI **and** supplies `LIFEOS_TTS_SECRET` or `LIFEOS_WRITE_SECRET`. `provider: "browser"` never selects OpenAI. Missing or failed server TTS returns an explicit browser-fallback result |
| LiveKit | Credentials may be present; **room tokens are not minted**; provider is **not** advertised as ready |
| Presence | CSS abstract presence |

### Conversation mute contract

Mute must stop microphone capture (`stopListening` → `recognition.abort()` with handlers cleared) and prevent voice transcript submission. Changing a button label alone is insufficient. Permission denial is a distinct `permission-denied` state. Sending a new turn or using Interrupt must stop browser TTS and server audio so speech does not overlap. Push-to-talk is hold-to-speak: pointer/key down starts listening, release calls `releaseListening()` (`recognition.stop()`) so the last utterance can flush. See `components/agent/AgentConversationWorkspace.tsx`.

## Security model

- `LIFEOS_VOICE_ENABLED=true` required to enable the console
- Permanent provider keys never sent to the browser
- When `LIFEOS_VOICE_SESSION_SECRET` is set, session tokens are HMAC-signed with 1-hour expiry
- Write tools require `LIFEOS_WRITE_ENABLED` + `LIFEOS_WRITE_SECRET`
- Conversation approvals use the same owner write secret. Public voice-session tokens cannot approve or execute external actions
- Write actions require explicit confirmation UI + spoken confirm
- Staging only (`proposal-only`) — never direct `main`
- Voice staging events update the Command Board approval package in-browser
- Rate limits on session, tool, speak, and agent routes use a trusted client identity (authorization subject plus origin/referer/UA). `X-Forwarded-For` is not trusted by itself
- `POST /api/lifeos/voice/speak` validates origin, requires paid-TTS authorization that cannot be minted from the public session endpoint, limits text to 2000 characters, returns sanitized errors, and never exposes provider credentials
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
3. Explicit browser-fallback JSON when `provider: "browser"` is requested or server OpenAI TTS is unauthorized, unconfigured, or failed
4. Clear disabled/error states when unsupported

## Configuration

See `.env.example` and `docs/DEPLOYMENT.md`.
