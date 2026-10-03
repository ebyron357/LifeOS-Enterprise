#Requires -Version 5.1
<#
.SYNOPSIS
    LifeOS Windows voice client shared by Claude Code, Codex, OpenCode, and Hermes.
.DESCRIPTION
    One entry point that every agent calls for spoken turns. It reuses the
    Local VoiceMode LLM runtime (Silero VAD recorder, local Parakeet STT,
    local Supertonic TTS through the upstream talk.ps1 playback path) and adds
    what a hands-free accessibility loop needs on Windows:

      - the ready beep plays only after the recorder has loaded and is
        actually capturing, so first words are not lost;
      - stdout carries only the user's words, so agents can rely on it;
      - local-only by default: cloud keys are ignored and non-local service
        URLs are refused unless VOICE_ALLOW_CLOUD=1;
      - spoken stop phrases end the session (word-boundary match);
      - a cough or noise that produces no words does not end the session;
      - recordings are written to a private temp folder and deleted after
        transcription; the turn log keeps timings only, never words or audio.

    Output contract:
      stdout  only the user's transcribed words (one line), nothing else.
      stderr  diagnostics; every line starts with "[talk]".
      empty stdout with exit code 0 means the session ended; stderr says why.

    Exit codes: 0 ok or session ended, 2 usage, 3 privacy refusal,
    4 listening failed, 5 speech playback failed, 6 runtime not installed.
.PARAMETER Command
    speak   Say the text aloud, then listen and print the user's reply.
    notify  Say the text aloud without opening the microphone.
    listen  Listen and print what the user says.
    status  Service health, audio devices, and voice settings.
    devices List microphones.
.PARAMETER TextFile
    UTF-8 file holding the text to say (used by talk-win.sh to avoid quoting problems).
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File Invoke-Talk.ps1 speak "Done. What next?"
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('speak', 'notify', 'listen', 'status', 'devices')]
    [string]$Command = 'listen',

    [string]$TextFile = '',

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Text = @()
)

$ErrorActionPreference = 'Stop'

function Get-Setting {
    param([string]$Name, [string]$Default)
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) { return $Default }
    return $value.Trim()
}

$UserHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath('UserProfile') }
$LocalAppData = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { [Environment]::GetFolderPath('LocalApplicationData') }
$ConfigDir = Join-Path $UserHome '.config\opencode'
$RuntimeDir = Get-Setting 'VOICE_RUNTIME_DIR' (Join-Path $ConfigDir 'skills\talk')
$TalkPs1 = Join-Path $RuntimeDir 'talk.ps1'
$VadPy = Join-Path $RuntimeDir 'vad_recorder.py'
$VenvPython = Get-Setting 'PYTHON' (Join-Path $ConfigDir 'tts-venv\Scripts\python.exe')

# Accessibility-oriented defaults. Upstream Windows ends a session after 30 s of
# silence and cuts a turn at 30 s of speech; both are too short for a voice-only user.
$IdleTimeoutS = Get-Setting 'TALK_IDLE_TIMEOUT_S' '300'
$MaxTurnS = Get-Setting 'TALK_MAX_TURN_S' '120'
$MinSilenceMs = Get-Setting 'VAD_MIN_SILENCE_MS' '700'
$VadThreshold = Get-Setting 'VAD_THRESHOLD' '0.5'
$ReadyDelayMs = Get-Setting 'TALK_READY_DELAY_MS' '250'
$ReadyCue = Get-Setting 'TALK_READY_CUE' '1'
$MicQuery = Get-Setting 'MIC_QUERY' ''
$StopPhrases = Get-Setting 'TALK_STOP_PHRASES' 'stop talk|end voice mode|exit voice mode'
$SttUrl = Get-Setting 'STT_URL' 'http://127.0.0.1:5093/v1/audio/transcriptions'
$SttModel = Get-Setting 'STT_MODEL' 'parakeet-tdt-0.6b-v3'
$AllowCloud = (Get-Setting 'VOICE_ALLOW_CLOUD' '0') -eq '1'
$TurnLog = (Get-Setting 'VOICE_TURN_LOG' '1') -ne '0'
$EmptyRetries = 3

$LocalTtsEngines = 'supertonic', 'coreml-tts', 'indextts'
$turn = [ordered]@{ ts = [DateTime]::UtcNow.ToString('o'); command = $Command; privacy = $(if ($AllowCloud) { 'cloud-allowed' } else { 'local-only' }) }

function Write-Diag {
    param([string]$Message)
    [Console]::Error.WriteLine("[talk] $Message")
}

function Exit-Talk {
    param([int]$Code, [string]$Outcome)
    $turn.outcome = $Outcome
    $turn.exit_code = $Code
    if ($TurnLog) {
        try {
            $logDir = Join-Path $LocalAppData 'LifeOS\voice\logs'
            if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
            $line = ($turn | ConvertTo-Json -Compress -Depth 3)
            $logPath = Join-Path $logDir ('turns-{0}.jsonl' -f [DateTime]::UtcNow.ToString('yyyyMMdd'))
            [IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
        } catch {}
    }
    exit $Code
}

function Test-LoopbackUrl {
    param([string]$Url)
    try { return ([Uri]$Url).IsLoopback } catch { return $false }
}

function ConvertTo-ProcessArgument {
    # Windows command-line quoting so paths with spaces (C:\Users\First Last) survive Start-Process.
    param([string]$Value)
    if ($Value -eq '') { return '""' }
    if ($Value -notmatch '[\s"]') { return $Value }
    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    $escaped = $escaped -replace '(\\+)$', '$1$1'
    return '"' + $escaped + '"'
}

function Read-SharedText {
    # The recorder is still writing this file, so open it with read/write sharing.
    # Returns $null when the file cannot be opened right now.
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return '' }
    try {
        $stream = [IO.File]::Open($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
    } catch [IO.IOException] {
        return $null
    }
    try {
        $reader = New-Object IO.StreamReader($stream)
        return $reader.ReadToEnd()
    } finally {
        $stream.Dispose()
    }
}

function ConvertTo-SpeechText {
    # Agents write Markdown; read it as speech instead of symbols.
    param([string]$Value)
    $s = $Value -replace '(?s)```.*?```', ' (code is shown on screen) '
    $s = $s -replace '`([^`]*)`', '$1'
    $s = $s -replace '!?\[([^\]]+)\]\([^)]+\)', '$1'
    $s = $s -replace 'https?://\S+', 'a link on screen'
    $s = $s -replace '(?m)^\s{0,3}#{1,6}\s*', ''
    $s = $s -replace '(?m)^\s*[-*+]\s+', ''
    $s = $s -replace '(\*\*|__|\*|~~)', ''
    $s = $s -replace '(?m)^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-*:?\s*$', ''
    $s = $s -replace '\s*\|\s*', ', '
    $s = $s -replace '\s+', ' '
    return $s.Trim(' ', ',')
}

function Split-SpeechChunks {
    # Shorter requests start playback sooner and stay inside the TTS request timeout.
    param([string]$Value, [int]$Limit = 350)
    $chunks = New-Object System.Collections.Generic.List[string]
    $current = ''
    foreach ($sentence in ($Value -split '(?<=[.!?;:])\s+')) {
        if (-not $sentence) { continue }
        if ($current -and ($current.Length + $sentence.Length + 1) -gt $Limit) {
            $chunks.Add($current)
            $current = $sentence
        } elseif ($current) {
            $current = "$current $sentence"
        } else {
            $current = $sentence
        }
    }
    if ($current) { $chunks.Add($current) }
    return $chunks
}

function Get-NormalizedWords {
    param([string]$Value)
    return (($Value.ToLowerInvariant() -replace "[^\p{L}\p{Nd}' ]", ' ') -replace '\s+', ' ').Trim()
}

function Test-StopPhrase {
    # Word-boundary match: "stop talk" ends the session, "stop talking about X" does not.
    param([string]$Heard)
    $words = " $(Get-NormalizedWords $Heard) "
    foreach ($phrase in $StopPhrases.Split('|')) {
        $normalized = Get-NormalizedWords $phrase
        if ($normalized -and $words.Contains(" $normalized ")) { return $true }
    }
    return $false
}

function Get-CurlPath {
    # In Windows PowerShell "curl" is an alias for Invoke-WebRequest; always use the real binary.
    foreach ($name in 'curl.exe', 'curl') {
        $command = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) { return $command.Source }
    }
    return $null
}

function Invoke-Upstream {
    # Runs the upstream talk.ps1 in this process with its console messages captured.
    # Named parameters: positional text starting with "-" would be bound as a parameter name.
    param([string]$Verb, [string]$Message = '')
    $saved = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($Message) { return @(& $TalkPs1 -Command $Verb -TextArgs @($Message) 6>&1 2>&1) }
        return @(& $TalkPs1 -Command $Verb 6>&1 2>&1)
    } finally {
        $ErrorActionPreference = $saved
    }
}

function Invoke-Speech {
    param([string]$Message)
    $env:TALK_AUTO_LISTEN = '0'
    $spoken = ConvertTo-SpeechText $Message
    if (-not $spoken) { return $true }
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $ok = $true
    foreach ($chunk in (Split-SpeechChunks $spoken)) {
        foreach ($record in (Invoke-Upstream 'speak' $chunk)) {
            $line = "$record".Trim()
            if (-not $line) { continue }
            if ($line -match 'All TTS engines failed') { $ok = $false }
            Write-Diag ($line -replace '^\[(talk|tts)\]\s*', '')
        }
        if (-not $ok) { break }
    }
    $turn.speech_chars = $spoken.Length
    $turn.speech_ms = $timer.ElapsedMilliseconds
    return $ok
}

function Invoke-Transcription {
    param([string]$WavPath, [string]$WorkDir)
    $curl = Get-CurlPath
    if (-not $curl) { throw 'curl.exe was not found (it ships with Windows 10 1803 and later).' }
    $responsePath = Join-Path $WorkDir 'stt.json'
    $saved = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $code = & $curl -sS -m 120 -o $responsePath -w '%{http_code}' -F "file=@$WavPath" -F "model=$SttModel" $SttUrl 2>$null
    } finally {
        $ErrorActionPreference = $saved
    }
    if (-not $code -or [int]"$code" -lt 200 -or [int]"$code" -ge 300) {
        throw "speech-to-text service at $SttUrl answered HTTP $code. Check: Start-ScheduledTask 'OpenCode-Parakeet-STT'"
    }
    $body = [IO.File]::ReadAllText($responsePath) | ConvertFrom-Json
    return "$($body.text)".Trim()
}

function Invoke-ListenOnce {
    if (-not (Test-Path -LiteralPath $VenvPython)) { throw "voice Python environment not found at $VenvPython. Run Install-VoiceMode.ps1." }
    if (-not (Test-Path -LiteralPath $VadPy)) { throw "recorder not found at $VadPy. Run Install-VoiceMode.ps1." }

    $work = Join-Path ([IO.Path]::GetTempPath()) ('lifeos-talk-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $work | Out-Null
    try {
        $eventsPath = Join-Path $work 'events.jsonl'
        $errorPath = Join-Path $work 'recorder.log'
        $arguments = @(
            $VadPy, '--oneshot',
            '--output-dir', $work, '--output-file', 'turn.wav',
            '--vad-threshold', $VadThreshold,
            '--min-silence-ms', $MinSilenceMs,
            '--ready-delay-ms', $ReadyDelayMs,
            '--idle-timeout-s', $IdleTimeoutS,
            '--max-duration-s', $MaxTurnS
        )
        if ($MicQuery) { $arguments += @('--mic-query', $MicQuery) }
        $argumentLine = ($arguments | ForEach-Object { ConvertTo-ProcessArgument $_ }) -join ' '

        $timer = [Diagnostics.Stopwatch]::StartNew()
        $process = Start-Process -FilePath $VenvPython -ArgumentList $argumentLine -WorkingDirectory $work `
            -RedirectStandardOutput $eventsPath -RedirectStandardError $errorPath -PassThru -NoNewWindow
        $null = $process.Handle  # keeps ExitCode readable in Windows PowerShell 5.1

        $cued = $false
        while (-not $process.HasExited) {
            if (-not $cued) {
                $sofar = Read-SharedText $eventsPath
                # Fallback if the event file is unreadable: cue after a fixed delay rather than never.
                $ready = if ($null -eq $sofar) { $timer.ElapsedMilliseconds -ge 3000 } else { $sofar -match '"event":\s*"listening"' }
                if ($ready) {
                    $turn.recorder_ready_ms = $timer.ElapsedMilliseconds
                    if ($ReadyCue -ne '0') { try { [Console]::Beep(880, 120) } catch {} }
                    $cued = $true
                }
            }
            Start-Sleep -Milliseconds 50
        }
        $process.WaitForExit()
        $turn.listen_ms = $timer.ElapsedMilliseconds

        $events = @((Read-SharedText $eventsPath) -split "`r?`n" | Where-Object { $_.Trim() } | ForEach-Object {
            try { $_ | ConvertFrom-Json } catch { $null }
        } | Where-Object { $_ })
        $failure = $events | Where-Object { $_.event -eq 'error' } | Select-Object -First 1
        $speech = $events | Where-Object { $_.event -eq 'speech_end' } | Select-Object -Last 1
        $idle = $events | Where-Object { $_.event -eq 'idle_timeout' } | Select-Object -First 1

        if ($failure) { return [pscustomobject]@{ Outcome = 'error'; Text = ''; Detail = "recorder: $($failure.message)" } }
        if ($speech) {
            if ("$($speech.reason)" -eq 'max_duration') {
                Write-Diag "This turn reached the $MaxTurnS-second limit, so the end of it was not captured. Ask the user to repeat the last part if it seems cut off."
            }
            $sttTimer = [Diagnostics.Stopwatch]::StartNew()
            $heard = Invoke-Transcription $speech.file $work
            $turn.stt_ms = $sttTimer.ElapsedMilliseconds
            return [pscustomobject]@{ Outcome = 'speech'; Text = $heard; Detail = '' }
        }
        if ($idle) { return [pscustomobject]@{ Outcome = 'idle'; Text = ''; Detail = '' } }

        $log = (Read-SharedText $errorPath).Trim()
        $tail = if ($log) { ($log -split "`r?`n" | Select-Object -Last 3) -join ' | ' } else { 'no output' }
        return [pscustomobject]@{ Outcome = 'error'; Text = ''; Detail = "recorder exited with code $($process.ExitCode) without a result ($tail)" }
    } finally {
        # Privacy: the recording and its transcript response never outlive the turn.
        Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-ListenTurn {
    for ($attempt = 1; $attempt -le $EmptyRetries; $attempt++) {
        try {
            $result = Invoke-ListenOnce
        } catch {
            Write-Diag "ERROR: listening failed: $($_.Exception.Message)"
            Exit-Talk 4 'listen-error'
        }
        switch ($result.Outcome) {
            'error' {
                Write-Diag "ERROR: listening failed: $($result.Detail). Check the microphone with: talk-win.sh devices"
                Exit-Talk 4 'listen-error'
            }
            'idle' {
                Write-Diag "SESSION ENDED: no speech for $IdleTimeoutS seconds. Voice mode is off until the user asks for it again."
                Exit-Talk 0 'ended-idle'
            }
            'speech' {
                if (-not $result.Text) {
                    Write-Diag 'Heard sound but no words; listening again.'
                    continue
                }
                $turn.heard_chars = $result.Text.Length
                if (Test-StopPhrase $result.Text) {
                    Write-Diag 'SESSION ENDED: the user said a stop phrase. Voice mode is off until the user asks for it again.'
                    Exit-Talk 0 'ended-stop-phrase'
                }
                [Console]::Out.WriteLine($result.Text)
                return
            }
        }
    }
    Write-Diag "ERROR: heard sound $EmptyRetries times but no words were recognized. The microphone may be picking up noise; check MIC_QUERY or VAD_THRESHOLD."
    Exit-Talk 4 'listen-no-words'
}

# --- Main ---------------------------------------------------------------------------

try { [Console]::OutputEncoding = New-Object Text.UTF8Encoding($false) } catch {}

if (-not (Test-Path -LiteralPath $TalkPs1)) {
    Write-Diag "ERROR: Local VoiceMode runtime not found at $RuntimeDir. Run integrations\local-voicemode\Install-VoiceMode.ps1."
    Exit-Talk 6 'runtime-missing'
}

if (-not $AllowCloud) {
    # Upstream talk.ps1 silently falls back to xAI cloud TTS when XAI_API_KEY is set; this process never lets it.
    Remove-Item Env:XAI_API_KEY -ErrorAction SilentlyContinue
    if ($env:TTS_ENGINE -and ($LocalTtsEngines -notcontains $env:TTS_ENGINE.ToLowerInvariant())) {
        Write-Diag "TTS_ENGINE=$($env:TTS_ENGINE) is not a local engine; using local Supertonic. Set VOICE_ALLOW_CLOUD=1 to allow cloud voices."
        $env:TTS_ENGINE = 'supertonic'
    }
    foreach ($name in 'STT_URL', 'SUPERTONIC_URL', 'INDEXTTS_URL') {
        $value = [Environment]::GetEnvironmentVariable($name)
        if ($value -and -not (Test-LoopbackUrl $value)) {
            Write-Diag "REFUSED: $name points to $value, which is not this computer. Audio and replies stay local unless VOICE_ALLOW_CLOUD=1."
            Exit-Talk 3 'privacy-refused'
        }
    }
}

$message = ''
if ($TextFile) {
    if (-not (Test-Path -LiteralPath $TextFile)) { Write-Diag "ERROR: text file not found: $TextFile"; Exit-Talk 2 'usage' }
    $message = [IO.File]::ReadAllText($TextFile, [Text.Encoding]::UTF8)
} elseif ($Text.Count -gt 0) {
    $message = $Text -join ' '
}

switch ($Command) {
    'notify' {
        if (-not $message.Trim()) { Write-Diag 'ERROR: notify needs text.'; Exit-Talk 2 'usage' }
        if (-not (Invoke-Speech $message)) {
            Write-Diag 'ERROR: text-to-speech failed, so the user did NOT hear this. Run: talk-win.sh status'
            Exit-Talk 5 'speech-error'
        }
        Exit-Talk 0 'spoken'
    }
    'speak' {
        if (-not $message.Trim()) { Write-Diag 'ERROR: speak needs text.'; Exit-Talk 2 'usage' }
        $spokeOk = Invoke-Speech $message
        if (-not $spokeOk) {
            Write-Diag 'WARNING: text-to-speech failed, so the user did NOT hear your reply. Listening anyway; tell them in text and run status.'
        }
        Invoke-ListenTurn
        Exit-Talk $(if ($spokeOk) { 0 } else { 5 }) $(if ($spokeOk) { 'turn' } else { 'turn-speech-error' })
    }
    'listen' {
        Invoke-ListenTurn
        Exit-Talk 0 'turn'
    }
    'status' {
        foreach ($record in (Invoke-Upstream 'status')) { [Console]::Out.WriteLine("$record") }
        [Console]::Out.WriteLine('')
        [Console]::Out.WriteLine('=== LifeOS voice client ===')
        [Console]::Out.WriteLine("  Privacy: $(if ($AllowCloud) { 'cloud allowed (VOICE_ALLOW_CLOUD=1)' } else { 'local only' })")
        [Console]::Out.WriteLine("  Session ends after silence: $IdleTimeoutS s; longest turn: $MaxTurnS s; end-of-turn pause: $MinSilenceMs ms")
        [Console]::Out.WriteLine("  Stop phrases: $StopPhrases")
        [Console]::Out.WriteLine("  Microphone filter: $(if ($MicQuery) { $MicQuery } else { 'Windows default input' })")
        Exit-Talk 0 'status'
    }
    'devices' {
        foreach ($record in (Invoke-Upstream 'devices')) { [Console]::Out.WriteLine("$record") }
        Exit-Talk 0 'devices'
    }
}
