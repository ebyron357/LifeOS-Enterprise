---
name: talk
description: >-
  Hands-free two-way voice conversation on Windows, used as an accessibility
  interface. Speaks your replies aloud with local Supertonic text-to-speech and
  listens for the user's next turn with Silero VAD and local Parakeet
  speech-to-text; audio and text stay on this computer. Use when the user says
  talk, voice mode, talk mode, let's talk, speak to me, or asks to hear a reply
  read aloud.
---

<!-- lifeos-voice-skill: installed by LifeOS integrations/local-voicemode/Install-VoiceMode.ps1; rerun it after upstream setup.ps1 repairs -->

# Talk: hands-free voice on Windows

The user may rely on voice to use you. Every reply in voice mode must be spoken,
and the microphone must reopen after every reply until the user ends the session.

## The command

Run every voice command with the Bash tool and **always pass `timeout: 600000`**.
A listening turn waits up to five minutes for the user to start speaking, which is
longer than the default two-minute Bash timeout.

```bash
bash ~/.config/opencode/skills/talk/talk-win.sh speak 'Your spoken reply.'
```

| Command | What it does |
|---|---|
| `speak '<text>'` | Says the text, beeps, listens, and prints what the user said next |
| `notify '<text>'` | Says the text only; the microphone stays closed |
| `listen` | Beeps, listens, and prints what the user said |
| `status` | Service health, microphones, and voice settings |
| `devices` | Lists microphones |

Inside single quotes, write an apostrophe as `'\''` (for example `'I'\''m on it.'`).
For long text, `printf '%s' "$reply" | bash ~/.config/opencode/skills/talk/talk-win.sh speak -` also works.

Reading the result:

- Output lines that do **not** start with `[talk]` are the user's own words.
- `[talk] SESSION ENDED` means the user said a stop phrase or stayed silent. Leave voice mode, say so in text, and do not listen again.
- `[talk] ERROR` or `[talk] WARNING` means something failed. Explain it in text, run `status`, and try `notify` so the user also hears it. Never invent a transcript.
- If the Bash call itself times out, run `listen` once to resume.

## Conversation loop

1. Start: `speak 'Voice mode is on. I'\''m listening.'` The output is the user's first request.
2. Work on the request. If it will take more than a few seconds, first run
   `notify 'On it. This will take a minute.'` so the user is not left in silence.
3. Answer with `speak '<short spoken reply>'`. Its output is the user's next turn.
4. Repeat steps 2 and 3. Never call `listen` right after `speak`; `speak` already listened.

## Speaking style

- Short, plain sentences. Lead with the answer or the outcome.
- No Markdown, code, file paths, or URLs in spoken text. Summarise them in words
  (for example "I changed two files; the details are on screen") and keep the
  full written answer in your normal text output.
- Read numbers and steps naturally ("first", "second").
- Before anything destructive or outward-facing (delete, send, publish, push,
  purchase), ask by voice and act only after a clear spoken yes.

## Privacy

Speech recognition and synthesis run locally on `127.0.0.1`. The client ignores
cloud voice keys and refuses non-local service URLs unless the user has set
`VOICE_ALLOW_CLOUD=1` themselves. Do not set it, and do not switch to a cloud voice
on your own.

## Ending and tuning

Stop phrases: "stop talk", "end voice mode", "exit voice mode" (`TALK_STOP_PHRASES`).
Silence ends the session after `TALK_IDLE_TIMEOUT_S` seconds (default 300). One
turn can last up to `TALK_MAX_TURN_S` seconds (default 120). If replies get cut
off mid-sentence, raise `VAD_MIN_SILENCE_MS` (default 700). If background noise
triggers turns, raise `VAD_THRESHOLD` toward 0.6 or set `MIC_QUERY` to the
microphone's name.

## If PowerShell is your shell instead of Bash

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.config\opencode\skills\talk\Invoke-Talk.ps1" speak 'Your spoken reply.'
```
