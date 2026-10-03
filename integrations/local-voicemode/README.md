# Local voice layer (Windows): hands-free voice for Claude Code and other agents

**Status:** prepared and tested without audio hardware. **Not yet installed or verified on the owner's Windows computer.** Run the three commands in [Install on the Windows computer](#install-on-the-windows-computer). Then record the evidence in `docs/VAULT_REPAIR_REPORT.md`.
**Upstream baseline:** [groxaxo/Local-VoiceMode-LLM](https://github.com/groxaxo/Local-VoiceMode-LLM) at commit `c3f6ca43580999f546bb5c3de9f70c59d607ac89` (2026-08-29), reviewed 2026-10-03.
**Purpose:** an accessibility requirement. The owner can talk to Claude Code and hear every reply. The microphone reopens automatically for the next turn.

```text
microphone -> Silero VAD (end of turn) -> Parakeet STT 127.0.0.1:5093 -> Claude Code
           <- speakers/headphones <- Supertonic TTS 127.0.0.1:8766 <- spoken reply
           -> beep, microphone reopens -> next turn ...
```

All speech processing runs on the CPU on this computer. Claude Code remains the reasoning model, and no local coding LLM is installed. One shared runtime serves every agent. Each agent receives only a small skill file pointing at it.

## Where it fits in MAPS

| Layer | What lives where |
|---|---|
| Memory | This README is the canonical record of the voice layer. The web portal's browser voice is a separate system, documented in [`docs/VOICE_ARCHITECTURE.md`](../../docs/VOICE_ARCHITECTURE.md). |
| Agent | The `talk` skill (installed per agent) and the shared Windows voice client (`agent/Invoke-Talk.ps1`, `agent/talk-win.sh`). |
| Pulse | None. The two speech services start at Windows logon through per-user Task Scheduler tasks owned by the upstream installer. No recurring LifeOS routine is registered. |
| Screen | None. Voice state is not shown on dashboards. |

Evidence (inspection, install, and verification JSON) and the per-turn timing log are machine-specific. They stay on the computer under `%LOCALAPPDATA%\LifeOS\voice\` and are not committed.

## Install on the Windows computer

Open **Windows PowerShell** in your LifeOS repository folder (the folder that contains this repository's `MAPS.md`), then run:

```powershell
# Phase 1: read-only inspection. Installs and changes nothing.
powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Test-VoicePrereqs.ps1

# Phases 3-6: install missing prerequisites only, install VoiceMode, wire up Claude Code, run checks.
powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Install-VoiceMode.ps1

# Hardware check: you hear three prompts and answer out loud. Memory is sampled throughout.
powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Test-VoiceLoop.ps1 -Interactive
```

Then open a **new** terminal and run `claude`. Type `/talk` or say "voice mode". To end the session, say "stop talk".

Useful installer options:

| Option | Effect |
|---|---|
| `-Agents "claudecode,codex,opencode,hermes"` | Install the Windows `talk` skill for more agents (default: `claudecode`). |
| `-InstallRoot D:\tools` | Clone somewhere other than `%USERPROFILE%\dev\tools`. |
| `-Repair` | Regenerate upstream scheduled tasks and start scripts. Downloaded models are kept. |
| `-SkillsOnly` | Reinstall only the voice client, skills, and Claude Code permission rule (needed after running upstream `setup.ps1` yourself). |
| `-NoClaudeSettings` | Do not edit `settings.json`. The installer prints the rule for you to add by hand. |
| `-WhatIf` | Show what would change without changing anything. |

## What each phase does

### Phase 1: inspection (`Test-VoicePrereqs.ps1`, read-only)

It reports the following: Windows version and architecture, CPU, RAM, free disk on the install drive and profile drive, microphones and speakers (from Windows audio endpoints), and the Windows microphone privacy switches, including "Let desktop apps access your microphone". It also checks for Git, Git Bash, Python 3.12 (from the PEP 514 registry, so the Microsoft Store `python` alias is not mistaken for Python), the VC++ x64 runtime, FFmpeg, and winget. For PowerShell, it flags Group Policy execution policies that override `-ExecutionPolicy Bypass`. For Claude Code, it checks the CLI version, user, skills, and managed settings locations, and any existing VoiceMode install. It also detects voice software that competes for the microphone: Voice Access, Windows Speech Recognition, Dragon, Talon, Wispr Flow, superwhisper, NVIDIA Broadcast, Krisp, and Voicemeeter. Finally, it checks which program, if any, holds TCP ports 5093, 8766, 7862, and 7863.

The verdict is `READY`, `READY_AFTER_INSTALL` (only missing things the installer adds), or `BLOCKED`, with a fix for each blocker.

### Phase 2: resource protection

- Speech-to-text, text-to-speech, and voice detection are CPU-only. Upstream forces CPU ONNX Runtime and `USE_GPU=false`. No large language model is installed.
- Disk: about 6 GB is the minimum and 10 GB is recommended for the PyTorch CPU, ONNX Runtime, Parakeet, and Supertonic downloads. This is an estimate. The installer records the real duration.
- Memory: `Test-VoiceLoop.ps1` measures each service's working set after a real synthesis and transcription. `-Interactive` samples peak Python memory and lowest free RAM during the conversation. Upstream notes that Parakeet uses about 1.8 GB resident on macOS. Treat roughly 2–3 GB for the whole stack as an estimate until the Windows evidence replaces it.

### Phase 3: install (`Install-VoiceMode.ps1`)

1. Installs only missing prerequisites with winget: `Git.Git`, `Python.Python.3.12`, `Microsoft.VCRedist.2015+.x64` (Windows asks for administrator approval), and `Gyan.FFmpeg`. Working dependencies are not reinstalled.
2. Clones upstream into `%USERPROFILE%\dev\tools\Local-VoiceMode-LLM` and checks out the reviewed commit. It refuses to touch a clone with local changes.
3. Runs the documented native Windows installer, `setup.ps1 -Integrations opencode`. Python 3.12 is placed first on `PATH` for that child process only, and your global `PATH` is unchanged.
4. Installs the shared LifeOS voice client and the Windows `talk` skill, and adds one Claude Code permission rule. Existing files are backed up to `%LOCALAPPDATA%\LifeOS\voice\backups` before any change.
5. Runs the non-interactive verification and writes evidence.

### Phase 4: local audio stack (verified against the upstream docs and code at the pinned commit)

| Stage | Component | Endpoint | Started by |
|---|---|---|---|
| Voice activity detection | Silero VAD (`vad_recorder.py`, PyTorch CPU) | none (in process) | each listening turn |
| Speech-to-text | Parakeet TDT 0.6B v3, ONNX CPU | `127.0.0.1:5093` | task `OpenCode-Parakeet-STT` |
| Text-to-speech | Supertonic 3, ONNX CPU | `127.0.0.1:8766` | task `OpenCode-Supertonic` |
| Dashboard | FastAPI | `127.0.0.1:7862` | **not installed on native Windows.** Upstream ships it for Docker/Linux; the inspection still checks the port. |
| IndexTTS (optional) | CUDA voice cloning | `127.0.0.1:7863` | not used; needs about 10 GB of VRAM |

Both services bind to `127.0.0.1` only. `Test-VoiceLoop.ps1` fails if either one listens on any other address.

### Phase 5: privacy and cost

- **Default: local and free.** No audio, transcript, or reply text leaves the computer, and no paid API is called.
- Upstream's Windows `talk.ps1` **silently falls back to xAI cloud TTS** when Supertonic fails and `XAI_API_KEY` is set. The LifeOS client removes that key from its own process, forces a local TTS engine, and refuses to run if `STT_URL`, `SUPERTONIC_URL`, or `INDEXTTS_URL` points away from this computer.
- Cloud voices are possible only if the owner sets `VOICE_ALLOW_CLOUD=1`. The skill instructs agents never to set it.
- Recordings are written to a per-turn private temp folder and deleted right after transcription. Upstream's Windows script wrote them to `C:\tmp`.
- The turn log (`%LOCALAPPDATA%\LifeOS\voice\logs\turns-*.jsonl`) records timings and outcomes, never words or audio. Set `VOICE_TURN_LOG=0` to turn it off.

### Phase 6: Claude Code integration

- The skill is installed at `%USERPROFILE%\.claude\skills\talk\SKILL.md` and invoked with `/talk` or by asking for voice mode.
- Claude runs `bash ~/.config/opencode/skills/talk/talk-win.sh speak '<reply>'`. That command speaks the reply, beeps, listens, and prints only the user's words.
- The permission rule `Bash(bash ~/.config/opencode/skills/talk/talk-win.sh *)` in `%USERPROFILE%\.claude\settings.json` keeps each turn hands-free. Without it, every turn waits for a keyboard approval.
- The skill tells Claude to pass `timeout: 600000` on each call. A listening turn can wait five minutes, and the Bash tool's default timeout is two minutes.
- Claude Code's built-in `/voice` is push-to-talk dictation only and does not speak replies. It does not conflict with this layer and can be used alongside it.

## Upstream gaps on Windows and how LifeOS handles them

| Gap at the pinned commit | Effect on a voice-only user | LifeOS handling |
|---|---|---|
| The shared `skill/SKILL.md` describes the author's macOS setup: xAI cloud as the default STT and TTS, and `talk.sh` | Claude Code on Windows would call a bash script that needs a cloud key | A Windows `talk` skill replaces it for the selected agents |
| `talk.ps1` beeps before the recorder has loaded PyTorch and Silero | The first words after the beep are lost | The client beeps only after the recorder's `listening` event |
| `Write-Host` status text mixes into the transcript, and an empty result never happens | Agents cannot tell words from status or detect the end of a session | stdout carries only the user's words; diagnostics go to stderr with a `[talk]` prefix |
| The session ends after 30 s of silence | A pause to think ends voice mode | Default 300 s (`TALK_IDLE_TIMEOUT_S`) |
| A turn is cut at 30 s of continuous speech | Long requests are truncated | Default 120 s (`TALK_MAX_TURN_S`), and the agent is told when a cut happens |
| No stop phrases on Windows | The only way out is the keyboard | "stop talk", "end voice mode", and "exit voice mode", matched on whole words (`TALK_STOP_PHRASES`) |
| A cough or noise with no words ends the session | Voice mode drops unexpectedly | The client retries up to 3 times before reporting an error |
| Microphone failures look like silence | The user is never told why | The recorder's `error` event and crash logs are reported as `[talk] ERROR` |
| Silent xAI cloud fallback | Reply text could leave the computer | Blocked (see Phase 5) |
| The recorder runs unquoted, and recordings go to `C:\tmp` | Breaks for profile paths with spaces | Arguments are quoted, and recordings use a private temp folder |
| Replies are read as raw Markdown | Symbols get read aloud | Markdown is converted to plain speech, and long replies are chunked by sentence |

These are client-side fixes. The shared services, models, and recorder are upstream's and unchanged. Proposing the fixes upstream would let LifeOS drop most of the client.

## Remaining limits

- **No barge-in on Windows.** Upstream reads `TALK_BARGE_IN` but does not implement it on Windows, so the user waits for each reply to finish.
- **Speaker echo:** no echo cancellation. Use headphones or a headset if speakers bleed into the microphone.
- **Turn start-up time:** each listening turn starts a new Python process that loads PyTorch and Silero. The turn log's `recorder_ready_ms` measures this delay. A persistent recorder would need an upstream change.
- **One agent at a time:** Windows has no shared audio lock, so do not run voice mode in two agents at once.
- **Codex, OpenCode, Hermes:** they get the same skill with `-Agents`. They need a shell that can run the bash command or the PowerShell command in the skill, and a command allow rule in their own settings for hands-free turns.

## Tuning

Set these as user environment variables (`[Environment]::SetEnvironmentVariable('NAME','value','User')`), then open a new terminal.

| Variable | Default | Use |
|---|---|---|
| `TALK_IDLE_TIMEOUT_S` | `300` | Silence that ends the session (`0` = never) |
| `TALK_MAX_TURN_S` | `120` | Longest single turn |
| `VAD_MIN_SILENCE_MS` | `700` | Pause that ends a turn; raise it if you get cut off mid-sentence |
| `VAD_THRESHOLD` | `0.5` | Raise toward `0.6`–`0.7` if background noise starts turns |
| `MIC_QUERY` | Windows default input | Part of a microphone's name (`talk-win.sh devices` lists them) |
| `TALK_STOP_PHRASES` | `stop talk\|end voice mode\|exit voice mode` | Pipe-separated phrases that end the session |
| `SUPERTONIC_VOICE` | `F1` | `F1`–`F5` or `M1`–`M5` |
| `TALK_READY_CUE` | `1` | `0` turns off the ready beep |
| `VOICE_ALLOW_CLOUD` | unset | `1` allows cloud voices and remote services (owner decision only) |

## Verification and evidence

| Check | How |
|---|---|
| Client contract, stop phrases, privacy refusal, retries, Markdown cleanup, chunking, bridge quoting, paths with spaces, turn log, installer settings merge | `pwsh -NoProfile -File integrations/local-voicemode/tests/Test-VoiceClient.ps1` (fakes, no audio). 37/37 passed on Linux, PowerShell 7.4.6, on 2026-10-03 |
| Script syntax on Windows PowerShell 5.1 | All `.ps1` files are ASCII-only and parse cleanly. Run on the target with Windows PowerShell 5.1. |
| Services, localhost binding, privacy, silent TTS-to-STT pipeline, bridge, memory | `Test-VoiceLoop.ps1` on the Windows computer: **pending** |
| Speakers, microphone, auto re-listen, stop phrase | `Test-VoiceLoop.ps1 -Interactive` on the Windows computer: **pending** |
| Live Claude Code conversation | `/talk` in Claude Code on the Windows computer: **pending** |

## Removal

```powershell
# Stop and remove the two startup tasks; keep models for a later reinstall.
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\dev\tools\Local-VoiceMode-LLM\setup.ps1" -Uninstall
# Also delete models, environments, and the shared runtime (destructive).
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\dev\tools\Local-VoiceMode-LLM\setup.ps1" -Uninstall -Force
```

Then delete `%USERPROFILE%\.claude\skills\talk` and remove the `talk-win.sh` rule from `%USERPROFILE%\.claude\settings.json`. The original settings file is in `%LOCALAPPDATA%\LifeOS\voice\backups`.

## Files

| File | Role |
|---|---|
| `Test-VoicePrereqs.ps1` | Phase 1 read-only inspection |
| `Install-VoiceMode.ps1` | Install and repair |
| `Test-VoiceLoop.ps1` | Verification and evidence (`-Interactive` for hardware) |
| `agent/Invoke-Talk.ps1` | Shared Windows voice client used by every agent |
| `agent/talk-win.sh` | Git Bash bridge used by Claude Code's Bash tool |
| `agent/SKILL.md` | Windows `talk` skill |
| `tests/Test-VoiceClient.ps1` | Hardware-free regression tests |
