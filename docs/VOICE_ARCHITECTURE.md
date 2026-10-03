# LifeOS Voice Architecture (Verbal + Audio V1)

**Status:** Browser speech remains the V1 path. Server OpenAI TTS is optional and owner-authorized. Owner acceptance is still required.  
**Release:** LifeOS Enterprise v1.0 voice (PR #60), post-#60 paid-TTS and write-auth hardening, and the issue #58 conversation-voice production polish  
**Scope:** this document describes the implemented architecture on `main`; live deployment state is tracked in `docs/CANONICAL_LIVE_STATUS.md`

This document covers voice inside the LifeOS web app. Hands-free voice for Claude Code and other local agents on the owner's Windows computer is a separate system; see [`integrations/local-voicemode/README.md`](../integrations/local-voicemode/README.md).

Persistent conversational voice now also lives in `/conversation`. That layer reuses this transport and state machine. See `docs/INTERACTIVE_AGENT_RUNTIME.md`. The Command Center `VoiceConsole` remains the V1 command console.

## Architecture

```text
VoiceConsole (UI)
  ├─ XState voice machine (explicit states/transitions)
  ├─ Browser speech transport (Web Speech API)
  ├─ Command parser (deterministic, locale-ready)
  ├─ Tool registry (read/write classification)
  └─ Temporary in-browser transcript (not vault-persisted)

/conversation (AgentConversationWorkspace)
  ├─ lib/voice/conversation.ts          session state (listening/thinking/speaking/muted/error…)
  ├─ lib/voice/conversation-runtime.ts  cancellation gates, duplicate-turn guard, provider truth,
  │                                     settings parsing, capability detection, recognition errors
  ├─ lib/voice/voice-options.ts         OpenAI voice allowlist, BCP-47 locale mapping,
  │                                     browser-voice filtering, deterministic spoken-reply composer
  ├─ lib/voice/settings-store.ts        localStorage-backed voice settings (useSyncExternalStore)
  └─ lib/voice/provider.ts              browser recognition + synthesis transport, voices store

Server:
  GET  /api/lifeos/voice/session  → ephemeral HMAC session metadata (no permanent keys; not a write or paid-TTS credential)
  GET  /api/lifeos/agent/session  → tools + truthful TTS provider status + locale defaults
  POST /api/lifeos/agent/turn     → agent turn; accepts `responseStyle` (concise shortens the spoken reply)
  POST /api/lifeos/voice/tools    → validated tool execution
  POST /api/lifeos/voice/speak    → optional OpenAI TTS; browser provider returns immediately without spending a key

Command Board:
  listens for `lifeos-voice-staged-change` and applies browser drafts
```

## Providers implemented

| Layer | Implementation |
|-------|----------------|
| Realtime transport | Browser recognition + optional server TTS |
| Speech-to-text | Web Speech Recognition API |
| Language model | Deterministic command parser / agent runtime (policy-gated) |
| Text-to-speech | Browser `speechSynthesis` by default. Server OpenAI TTS (`gpt-4o-mini-tts`, `response_format: "mp3"`) only when the owner selects OpenAI **and** types `LIFEOS_TTS_SECRET` or `LIFEOS_WRITE_SECRET` into the Agent panel's “Owner write secret” field. `provider: "browser"` never selects OpenAI. Missing or failed server TTS returns an explicit browser-fallback result |
| LiveKit | Credentials may be present; **room tokens are not minted**; provider is **not** advertised as ready |
| Presence | CSS abstract presence |

## Providers & fallback order

### Truthful provider status

`GET /api/lifeos/agent/session` (and `/api/lifeos/voice/session`) report `tts.providers[]`:

- `openai.configured` is `true` only when `OPENAI_API_KEY` **and** at least one paid-TTS authorization secret (`LIFEOS_TTS_SECRET` or `LIFEOS_WRITE_SECRET`) are set. Without a secret it reports `configured: false` with the reason “Paid TTS authorization secret is not set (LIFEOS_TTS_SECRET or LIFEOS_WRITE_SECRET).” because every `/voice/speak` call would 503.
- `browser` is always `configured: true` (synthesis happens client-side).
- `tts.activeProvider` is the server's preferred provider under the same rule.

### Client selection rule

- The client **never auto-selects OpenAI**. With no saved preference the provider is `browser`. The owner opts in with the Provider select; the OpenAI option is disabled and labelled “(unavailable)” when the server reports it unconfigured.
- Paid TTS is authorized from the browser only by the owner secret typed into “Owner write secret”. That value is never stored, so even with OpenAI selected LifeOS does not call `/voice/speak` until the secret is entered in the current page session; until then it speaks with the browser voice and says why.

### Runtime order for each reply

1. OpenAI TTS — only when selected, server-configured, and the owner secret is present.
2. Browser `speechSynthesis` — default, and the fallback whenever `/voice/speak` returns `fallbackToBrowser`, a non-2xx status, a network error, or audio playback is blocked.
3. Text only — when speech synthesis is unsupported (the reply is still shown in the transcript).

The Conversation panel shows a visible `role="status"` / `aria-live="polite"` indicator of the provider **actually used** for the last reply, e.g. “Speaking with browser voice (system default) — OpenAI unavailable: Paid TTS authorization secret is not set …”. Fallback is never silent.

Voice selection: the Voice select lists `speechSynthesis.getVoices()` filtered to the selected output locale (loaded asynchronously via `voiceschanged`, with “System default” first) for the browser provider, or the OpenAI allowlist `alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse` for OpenAI. `/voice/speak` validates `voice` against that allowlist server-side (400 otherwise); when no voice is chosen the response-style mapping (`balanced → verse`, `concise → alloy`, `coach → sage`) remains the default. Preview voice uses the chosen provider and voice.

Locale: utterances are spoken with the selected locale's BCP-47 tag (`en-GB`, `zh-TW`, …); bare legacy codes keep their defaults (`en → en-US`, `fr → fr-FR`, `ht → ht-HT`). A chosen browser voice is applied only if it speaks that locale. If no installed browser voice matches the locale, a visible warning is shown — LifeOS never silently switches language.

## Latency

- **Browser speech:** synthesis runs locally in the browser/OS and typically starts almost immediately after the reply arrives. Speech recognition latency depends on the browser's speech service (some browsers send audio to a vendor service).
- **OpenAI TTS:** adds a network round trip (browser → LifeOS server → OpenAI → back) before playback can start, typically hundreds of milliseconds to a few seconds depending on reply length and network conditions. The full MP3 is downloaded before playback (no streaming in V1).
- End-to-end latency is **not yet measured in production**. Do not quote numbers until owner acceptance captures real measurements.

## Cost

- **Browser speech (recognition and synthesis):** no LifeOS or OpenAI charge.
- **OpenAI TTS:** billed by OpenAI per character/token of the text sent, according to current OpenAI pricing: <https://openai.com/api/pricing>. LifeOS limits a single request to 2000 characters, rate-limits `/voice/speak`, only calls OpenAI with the owner secret, and on Interrupt/Stop/Mute cancels the browser's in-flight request so the clip never plays. That cancellation is client-side: the server does not forward it to OpenAI, so an OpenAI call that has already started can still finish and be billed. The `concise` response style shortens the spoken reply, which also reduces the text sent to OpenAI.

## Privacy

- When the microphone is started, speech recognition audio is processed by the **browser or operating system's speech service** (for example, Chrome sends audio to Google's speech service; Safari uses Apple's). LifeOS does not receive or store that audio.
- When OpenAI voice is used, the **reply text** is sent to OpenAI to generate audio. No microphone audio is sent to OpenAI by LifeOS.
- **Nothing is recorded or stored by LifeOS**: no audio recordings; transcripts are temporary, in-browser only, and can be hidden or cleared. The owner secret is kept in memory only.
- The `/conversation` page shows this privacy note before the first microphone start, plus capability notes when recognition, synthesis, or continuous listening is unsupported (continuous listening is treated as unsupported on iOS/iPadOS WebKit; LifeOS restarts listening after each phrase there).

## Conversation runtime guarantees

### Conversation mute contract

Mute must stop microphone capture (`stopListening` → `recognition.abort()` with handlers cleared) and prevent voice transcript submission. Changing a button label alone is insufficient. Permission denial is a distinct `permission-denied` state. Sending a new turn or using Interrupt must stop browser TTS and server audio so speech does not overlap. Push-to-talk is hold-to-speak: pointer/key down starts listening, release calls `releaseListening()` (`recognition.stop()`) so the last utterance can flush. See `components/agent/AgentConversationWorkspace.tsx`.

### Interrupt, Stop, and stale replies

- In-flight `/api/lifeos/agent/turn` and `/api/lifeos/voice/speak` requests use `AbortController`s owned by monotonically increasing generation gates (`createRequestGate`).
- Interrupt and Stop conversation abort the pending turn and any pending speech; Mute aborts pending speech. A response that arrives for an older generation is dropped and never spoken.
- Every reply starts a new speech generation, so a pending OpenAI clip can never overlap a later browser utterance. `speechSynthesis.cancel()` errors (`interrupted`/`canceled`) are not reported as failures.

### Duplicate and concurrent turns

- Only one turn is in flight at a time. A transcript (voice or typed) that arrives meanwhile is **not sent**; a visible note says so and a typed draft is kept.
- An identical transcript (case/punctuation-insensitive) within 3 seconds of the previous submission or reply is dropped with a visible note.

### Recognition restart and recovery

- Starting while already listening with the same settings is a no-op; the transport detaches the old recognizer's handlers **before** `abort()`, so its `onend` cannot trigger the auto-restart loop.
- Starting a continuous conversation resets push-to-talk mode, so unmute resumes continuous listening; unmute in push-to-talk mode waits for the next hold.
- `no-speech`/`aborted` are benign. Other recognition errors stop auto-restart (no error loop) and show an alert with **Try again**, which re-initializes recognition without a page reload. Errors clear on a successful start, resume, or turn.

### Response style

The client sends `responseStyle` with every turn. The turn route composes the spoken reply deterministically (no LLM): `concise` speaks only the first sentence (capped at 160 characters); `balanced` and `coach` speak the full reply. The written reply is never shortened.

### Settings persistence

Voice settings (provider, locale, voice, input language, response style, speed, pitch) live in `localStorage` under `lifeos-conversation-voice-settings-v1` and hydrate on mount through `useSyncExternalStore`, independent of the session fetch. Nothing is written until the owner changes a setting, so defaults never overwrite saved settings; server locale defaults only apply when nothing is saved.

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
- `POST /api/lifeos/voice/speak` validates origin, requires paid-TTS authorization that cannot be minted from the public session endpoint, validates `voice` against the OpenAI allowlist, limits text to 2000 characters, returns sanitized errors, and never exposes provider credentials
- Transcripts marked temporary; no silent audio storage
- Wake-word / hands-free listening disabled

## Accessibility

- Voice optional; dashboard works without mic/audio/credentials
- Keyboard: Alt+V push-to-talk, Esc stop (VoiceConsole). On `/conversation`, all voice controls are native buttons reachable with Tab and operable with Enter/Space; Push to talk is hold-to-speak with Space/Enter
- Primary `/conversation` voice controls are at least 44px tall with ≥ 0.95rem labels and wrap without horizontal scrolling at 390px
- Transcript always available with role labels; the reply-voice indicator, turn notes, and warnings are announced via `aria-live`
- Reduced-motion / high-contrast compatible presence + visualizer

## Language preparation

`locale`, `transcriptionLanguage`, and `responseLanguage` support `en | ht | fr` for the VoiceConsole. `/conversation` offers `en-US`, `en-GB`, `zh-TW`, and `fr-FR` and speaks the selected tag. V1 phrases are English-first. Haitian Creole / French / Chinese are **not claimed verified**.

## Failure / fallback order

1. Written UI (always)
2. Browser speech when `LIFEOS_VOICE_ENABLED=true` and Web Speech is available
3. Explicit browser-fallback JSON when `provider: "browser"` is requested or server OpenAI TTS is unauthorized, unconfigured, or failed — surfaced in the visible reply-voice indicator
4. Clear disabled/error states when unsupported, with capability notes on mount and a Try again recovery path

## Owner manual acceptance (needs a real microphone)

Automated tests use fake recognizers and a recording `speechSynthesis`. These steps still need the owner on real hardware (desktop Chrome, desktop Safari, and an iPhone):

1. Open `/conversation`, read the privacy note, press **Start conversation**, grant the microphone, and confirm the state shows listening.
2. Say “What needs attention?” — confirm one transcript line, one reply, and that the reply is spoken. Confirm the reply-voice indicator names the browser voice.
3. While a reply is speaking, press **Interrupt assistant** — speech stops immediately and nothing resumes afterward. Repeat while the turn is still thinking.
4. Press **Mute microphone**, speak, and confirm nothing is submitted; **Unmute** and confirm listening resumes continuously.
5. Hold **Push to talk**, speak, release; then press **Start conversation** and confirm continuous listening continues after the first phrase.
6. Voice settings: choose English (UK), pick an installed voice, press **Preview voice**, reload the page, and confirm the locale and voice are restored. Choose a locale with no installed voice and confirm the warning.
7. OpenAI (only if configured with `OPENAI_API_KEY` and `LIFEOS_TTS_SECRET`/`LIFEOS_WRITE_SECRET`): select OpenAI, choose a voice, type the secret into Owner write secret, preview, and confirm the indicator says “Speaking with OpenAI voice (…)”. Enter a wrong secret and confirm the visible browser-fallback reason.
8. Revoke microphone permission in the browser, press Start, confirm the permission alert, re-grant, and press **Try again** without reloading.
9. On iPhone Safari confirm the continuous-listening capability note and that push-to-talk works.
10. Record observed latency (browser vs OpenAI) in the owner acceptance notes; it is not yet measured in production.

## Configuration

See `.env.example` and `docs/DEPLOYMENT.md`.
